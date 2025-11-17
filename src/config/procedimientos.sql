DROP PROCEDURE IF EXISTS insertar_solicitud_normal;
CREATE PROCEDURE insertar_solicitud_normal(
    IN p_usuario_id INT,
    IN p_espacio_id INT,
    IN p_periodo_id INT,
    IN p_materia_id INT,
    IN p_grupo VARCHAR(50),
    IN p_motivo VARCHAR(100),
    IN p_cantidad_asistentes SMALLINT,
    IN p_dias JSON,          
    IN p_hora_inicio TIME,
    IN p_hora_fin TIME
)
BEGIN
    DECLARE v_solicitud_id INT;
    DECLARE done INT DEFAULT 0;
    DECLARE v_dia SMALLINT;
    DECLARE v_msg VARCHAR(200);
    DECLARE v_conflicto_id INT;

    -- Validar horario
    IF p_hora_inicio >= p_hora_fin THEN
        SET v_msg = CONCAT('hora_inicio (', TIME_FORMAT(p_hora_inicio, '%H:%i'), 
                           ') debe ser menor que hora_fin (', TIME_FORMAT(p_hora_fin, '%H:%i'), ')');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    -- Validar días
    WHILE done < JSON_LENGTH(p_dias) DO
        SET v_dia = JSON_EXTRACT(p_dias, CONCAT('$[', done, ']'));
        IF v_dia < 1 OR v_dia > 7 THEN
            SET v_msg = CONCAT('Valor de día inválido: ', v_dia, '. Debe estar entre 1 y 7.');
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
        END IF;
        SET done = done + 1;
    END WHILE;

    SET done = 0;

    -- Insertar solicitud
    INSERT INTO solicitud(usuario_id, espacio_id, periodo_id, materia_id, grupo, motivo, cantidad_asistentes, estado)
    VALUES (p_usuario_id, p_espacio_id, p_periodo_id, p_materia_id, p_grupo, p_motivo, p_cantidad_asistentes, 'pendiente');

    SET v_solicitud_id = LAST_INSERT_ID();

    -- Insertar horarios
    WHILE done < JSON_LENGTH(p_dias) DO
        SET v_dia = JSON_EXTRACT(p_dias, CONCAT('$[', done, ']'));
        INSERT INTO solicitud_horario(solicitud_id, dia_semana, hora_inicio, hora_fin)
        VALUES(v_solicitud_id, v_dia, p_hora_inicio, p_hora_fin);
        SET done = done + 1;
    END WHILE;

    -- Verificar conflicto
    SELECT s.solicitud_id
    INTO v_conflicto_id
    FROM solicitud s
    JOIN solicitud_horario sh1 ON sh1.solicitud_id = s.solicitud_id
    JOIN solicitud_horario sh2 ON sh2.solicitud_id = v_solicitud_id
    WHERE s.solicitud_id <> v_solicitud_id
      AND s.espacio_id = p_espacio_id
      AND sh1.dia_semana = sh2.dia_semana
      AND (sh1.hora_inicio < p_hora_fin AND sh1.hora_fin > p_hora_inicio)
      AND s.estado IN ('pendiente','aprobada')
      LIMIT 1;

    -- Insertar notificación si hay conflicto
    IF v_conflicto_id IS NOT NULL THEN
        INSERT INTO notificacion(
            usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
        )
        VALUES (
            p_usuario_id, 'solicitud', 
            'Tu solicitud presenta un conflicto con otra solicitud. Está en espera de resolución.',
            NOW(), FALSE, FALSE, v_solicitud_id, 'solicitud'
        );
    END IF;

    -- **Siempre devolver el id de la solicitud creada**
    SELECT v_solicitud_id AS solicitud_id;

END;


DROP PROCEDURE IF EXISTS aprobar_solicitud_normal;
CREATE PROCEDURE aprobar_solicitud_normal(IN p_solicitud_id INT, IN p_admin_id INT)
BEGIN
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_espacio INT;
    DECLARE v_periodo INT;
    DECLARE v_fecha_inicio DATE;
    DECLARE v_fecha_fin DATE;
    DECLARE v_dia SMALLINT;
    DECLARE v_hi TIME;
    DECLARE v_hf TIME;
    DECLARE v_fecha DATE;
    DECLARE v_hora_actual TIME;

    DECLARE v_cnt_norm INT DEFAULT 0;
    DECLARE v_cnt_esp  INT DEFAULT 0;
    DECLARE v_sol_norm INT DEFAULT NULL;
    DECLARE v_sol_esp  INT DEFAULT NULL;

    DECLARE v_usuario_id INT;
    DECLARE v_usuario_email VARCHAR(255);

    DECLARE v_tuvo_conflicto BOOLEAN DEFAULT FALSE;
    DECLARE v_conflicto_solicitud_id INT DEFAULT NULL;

    DECLARE done INT DEFAULT 0;

    -- Cursor de horarios de la solicitud
    DECLARE cur_horarios CURSOR FOR
        SELECT DISTINCT dia_semana, hora_inicio, hora_fin
        FROM solicitud_horario
        WHERE solicitud_id = p_solicitud_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- Traer estado, espacio, periodo y usuario
    SELECT estado, espacio_id, periodo_id, usuario_id
    INTO v_estado_actual, v_espacio, v_periodo, v_usuario_id
    FROM solicitud
    WHERE solicitud_id = p_solicitud_id;

    -- Email del solicitante actual (solo referencia)
    SELECT email INTO v_usuario_email
    FROM usuario
    WHERE usuario_id = v_usuario_id;

    IF v_estado_actual = 'pendiente' THEN

        -- Fechas del periodo
        SELECT fecha_inicio, fecha_fin
        INTO v_fecha_inicio, v_fecha_fin
        FROM periodo
        WHERE periodo_id = v_periodo;

        OPEN cur_horarios;

        leer_horarios: LOOP
            FETCH cur_horarios INTO v_dia, v_hi, v_hf;
            IF done THEN
                LEAVE leer_horarios;
            END IF;

            SET v_fecha = v_fecha_inicio;

            WHILE v_fecha <= v_fecha_fin DO
                IF v_fecha IS NOT NULL AND (WEEKDAY(v_fecha) + 1) = v_dia THEN
                    SET v_hora_actual = v_hi;

                    WHILE v_hora_actual < v_hf DO
                        SET @hora_fin_reserva = ADDTIME(v_hora_actual, '01:00:00');

                        -- Detectar conflictos
                        SELECT
                            SUM(CASE WHEN solicitud_id IS NOT NULL
                                      AND solicitud_id <> p_solicitud_id THEN 1 ELSE 0 END),
                            MAX(CASE WHEN solicitud_id IS NOT NULL
                                      AND solicitud_id <> p_solicitud_id THEN solicitud_id END),
                            SUM(CASE WHEN solicitud_especial_id IS NOT NULL THEN 1 ELSE 0 END),
                            MAX(solicitud_especial_id)
                        INTO v_cnt_norm, v_sol_norm, v_cnt_esp, v_sol_esp
                        FROM reserva
                        WHERE espacio_id = v_espacio
                          AND fecha = v_fecha
                          AND hora_inicio < @hora_fin_reserva
                          AND hora_fin > v_hora_actual;

                        IF (v_cnt_norm > 0 OR v_cnt_esp > 0) THEN
                            SET v_tuvo_conflicto = TRUE;
                            
                            -- Guardar el ID de la solicitud en conflicto (solo para solicitudes normales)
                            IF v_sol_norm IS NOT NULL THEN
                                SET v_conflicto_solicitud_id = v_sol_norm;
                            END IF;

                            -- Insertar en conflicto_recurrente si es conflicto entre solicitudes normales
                            IF v_sol_norm IS NOT NULL THEN
                                IF NOT EXISTS (
                                    SELECT 1 FROM conflicto_recurrente 
                                    WHERE ((solicitud_id_1 = p_solicitud_id AND solicitud_id_2 = v_sol_norm)
                                        OR (solicitud_id_1 = v_sol_norm AND solicitud_id_2 = p_solicitud_id))
                                    AND estado = 'pendiente'
                                ) THEN
                                    INSERT INTO conflicto_recurrente(
                                        dia_semana, hora_inicio, hora_fin, estado, 
                                        espacio_id, periodo_id, solicitud_id_1, solicitud_id_2,
                                        observaciones
                                    )
                                    VALUES (
                                        v_dia, v_hi, v_hf, 'pendiente',
                                        v_espacio, v_periodo, p_solicitud_id, v_sol_norm,
                                        CONCAT('Conflicto detectado al aprobar solicitud ', p_solicitud_id, 
                                               ' con solicitud existente ', v_sol_norm)
                                    );
                                END IF;
                            END IF;

                        ELSE
                            -- Sin conflicto -> crear reserva
                            INSERT INTO reserva(solicitud_id, espacio_id, fecha, hora_inicio, hora_fin)
                            VALUES (p_solicitud_id, v_espacio, v_fecha, v_hora_actual, @hora_fin_reserva);
                        END IF;

                        SET v_hora_actual = @hora_fin_reserva;
                    END WHILE;
                END IF;

                SET v_fecha = DATE_ADD(v_fecha, INTERVAL 1 DAY);
            END WHILE;
        END LOOP leer_horarios;

        CLOSE cur_horarios;

        -- Marcar solicitud como aprobada
        UPDATE solicitud
        SET estado = 'aprobada'
        WHERE solicitud_id = p_solicitud_id;

        -- Rechazar solicitudes pendientes que ahora choquen con reservas creadas
        UPDATE solicitud s_pending
        JOIN solicitud_horario sh 
          ON sh.solicitud_id = s_pending.solicitud_id
        JOIN reserva r
          ON r.espacio_id = v_espacio
         AND r.fecha BETWEEN v_fecha_inicio AND v_fecha_fin
         AND r.hora_inicio < sh.hora_fin
         AND r.hora_fin    > sh.hora_inicio
        SET s_pending.estado = 'rechazada'
        WHERE s_pending.estado = 'pendiente'
          AND s_pending.solicitud_id <> p_solicitud_id
          AND (WEEKDAY(r.fecha) + 1) = sh.dia_semana;

        INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
        SELECT s.usuario_id, 
               'solicitud', 
               'Tu solicitud ha sido rechazada debido a conflicto con otra solicitud aprobada.', 
               NOW(), 
               FALSE, 
               FALSE, 
               s.solicitud_id, 
               'solicitud'
        FROM solicitud s
        WHERE s.estado = 'rechazada'
          AND s.solicitud_id <> p_solicitud_id
          AND NOT EXISTS (
                SELECT 1 
                FROM notificacion n 
                WHERE n.usuario_id = s.usuario_id
                  AND n.relacion_id = s.solicitud_id
                  AND n.relacion_tipo = 'solicitud'
                  AND n.mensaje LIKE 'Tu solicitud ha sido rechazada'
          );

        -- Nueva lógica de notificación final
        IF v_tuvo_conflicto = FALSE THEN
            -- Notificación al usuario
            IF NOT EXISTS (
                SELECT 1 FROM notificacion
                WHERE usuario_id = v_usuario_id
                  AND relacion_id = p_solicitud_id
                  AND relacion_tipo = 'solicitud'
                  AND mensaje = 'Tu solicitud fue aprobada exitosamente.'
            ) THEN
                INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
                VALUES (v_usuario_id, 'solicitud', 'Tu solicitud fue aprobada exitosamente.', NOW(), FALSE, FALSE, p_solicitud_id, 'solicitud');
            END IF;
        ELSE
            -- Notificación al usuario
            IF NOT EXISTS (
                SELECT 1 FROM notificacion
                WHERE usuario_id = v_usuario_id
                  AND relacion_id = p_solicitud_id
                  AND relacion_tipo = 'solicitud'
                  AND mensaje LIKE 'Tu solicitud fue aprobada pero está en espera'
            ) THEN
                INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
                VALUES (v_usuario_id, 'solicitud', 'Tu solicitud fue aprobada pero está en espera de resolución de conflicto con otra solicitud.', NOW(), FALSE, FALSE, p_solicitud_id, 'solicitud');
            END IF;

            -- Notificación al administrador
            IF NOT EXISTS (
                SELECT 1 FROM notificacion
                WHERE usuario_id = p_admin_id
                  AND relacion_id = p_solicitud_id
                  AND relacion_tipo = 'solicitud'
                  AND mensaje LIKE 'Has aprobado una solicitud en conflicto'
            ) THEN
                INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
                VALUES (p_admin_id, 'solicitud', 'Has aprobado una solicitud en conflicto, revisa y resuelve el error.', NOW(), FALSE, FALSE, p_solicitud_id, 'solicitud');
            END IF;
        END IF;

    END IF;
END;


DROP PROCEDURE IF EXISTS rechazar_solicitud_normal;
CREATE PROCEDURE rechazar_solicitud_normal(IN p_solicitud_id INT)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_tiene_reservas BOOLEAN DEFAULT FALSE;
    DECLARE v_tiene_conflicto_aprobadas BOOLEAN DEFAULT FALSE;
    DECLARE v_espacio_id INT;
    DECLARE v_periodo_id INT;
    DECLARE v_conflicto_count INT;

    -- Verificar si la solicitud existe
    IF NOT EXISTS (SELECT 1 FROM solicitud WHERE solicitud_id = p_solicitud_id) THEN
        SIGNAL SQLSTATE '45001' 
        SET MESSAGE_TEXT = 'La solicitud no existe.';
    END IF;

    -- Obtener información de la solicitud
    SELECT usuario_id, espacio_id, periodo_id
    INTO v_usuario_id, v_espacio_id, v_periodo_id
    FROM solicitud
    WHERE solicitud_id = p_solicitud_id;

    -- Verificar si existen reservas asociadas a la solicitud
    SELECT COUNT(*) > 0
    INTO v_tiene_reservas
    FROM reserva
    WHERE solicitud_id = p_solicitud_id;

    -- Verificar si existe conflicto con otra solicitud normal APROBADA
    SELECT COUNT(*)
    INTO v_conflicto_count
    FROM conflicto_recurrente cr
    WHERE cr.estado = 'pendiente'
      AND (cr.solicitud_id_1 = p_solicitud_id OR cr.solicitud_id_2 = p_solicitud_id)
      AND EXISTS (
          SELECT 1 FROM solicitud s 
          WHERE s.solicitud_id IN (cr.solicitud_id_1, cr.solicitud_id_2)
          AND s.estado = 'aprobada'
          AND s.solicitud_id <> p_solicitud_id
      );

    SET v_tiene_conflicto_aprobadas = (v_conflicto_count > 0);

    -- Si hay conflicto entre solicitudes aprobadas, cancelar el proceso
    IF v_tiene_conflicto_aprobadas THEN
        SIGNAL SQLSTATE '45002' 
        SET MESSAGE_TEXT = 'No se puede rechazar la solicitud. Existe un conflicto pendiente con otra solicitud aprobada que debe ser resuelto primero.';
    END IF;

    -- Si no hay conflicto, proceder con el rechazo normal
    IF v_tiene_reservas THEN
        -- Eliminar todas las reservas asociadas
        DELETE FROM reserva
        WHERE solicitud_id = p_solicitud_id;
    END IF;

    -- Marcar la solicitud como rechazada
    UPDATE solicitud
    SET estado = 'rechazada'
    WHERE solicitud_id = p_solicitud_id;

    -- Crear notificación al usuario
    IF NOT EXISTS (
        SELECT 1
        FROM notificacion
        WHERE usuario_id = v_usuario_id
          AND relacion_id = p_solicitud_id
          AND relacion_tipo = 'solicitud'
          AND mensaje LIKE 'Tu solicitud ha sido rechazada'
    ) THEN
        INSERT INTO notificacion(
            usuario_id,
            tipo,
            mensaje,
            fecha_envio,
            leida,
            enviado,
            relacion_id,
            relacion_tipo
        )
        VALUES (
            v_usuario_id,
            'solicitud',
            'Tu solicitud ha sido rechazada.',
            NOW(),
            FALSE,
            FALSE,
            p_solicitud_id,
            'solicitud'
        );
    END IF;

    -- También eliminar cualquier conflicto pendiente relacionado con esta solicitud
    DELETE FROM conflicto_recurrente
    WHERE estado = 'pendiente'
      AND (solicitud_id_1 = p_solicitud_id OR solicitud_id_2 = p_solicitud_id);

END;


DROP PROCEDURE IF EXISTS insertar_solicitud_especial;
CREATE PROCEDURE insertar_solicitud_especial(
    IN p_usuario_id INT,
    IN p_espacio_id INT,
    IN p_fecha DATE,
    IN p_motivo VARCHAR(100),
    IN p_cantidad_asistentes SMALLINT,
    IN p_hora_inicio TIME,
    IN p_hora_fin TIME
)
BEGIN
    DECLARE v_conflicto INT DEFAULT 0;
    DECLARE v_nueva_solicitud_id INT DEFAULT 0;

    -- Validar horas
    IF p_hora_inicio >= p_hora_fin THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'hora_inicio debe ser menor que hora_fin';
    END IF;

    -- Insertar solicitud pendiente inicialmente
    INSERT INTO solicitud_especial(
        usuario_id, espacio_id, fecha, motivo, cantidad_asistentes, hora_inicio, hora_fin, estado
    )
    VALUES (
        p_usuario_id, p_espacio_id, p_fecha, p_motivo, p_cantidad_asistentes, p_hora_inicio, p_hora_fin, 'pendiente'
    );

    SET v_nueva_solicitud_id = LAST_INSERT_ID();

    -- Verificar conflictos con reservas de solicitudes normales
    SELECT COUNT(*)
    INTO v_conflicto
    FROM reserva r
    WHERE r.espacio_id = p_espacio_id
      AND r.fecha = p_fecha
      AND r.hora_inicio < p_hora_fin
      AND r.hora_fin > p_hora_inicio;

    -- Verificar conflictos con otras solicitudes especiales
    SELECT v_conflicto + COUNT(*)
    INTO v_conflicto
    FROM solicitud_especial se
    WHERE se.espacio_id = p_espacio_id
      AND se.fecha = p_fecha
      AND se.estado IN ('pendiente','aprobada')
      AND se.hora_inicio < p_hora_fin
      AND se.hora_fin > p_hora_inicio
      AND se.solicitud_especial_id <> v_nueva_solicitud_id;

    -- Si hay conflicto, mantener estado 'pendiente' y notificar al usuario
    IF v_conflicto > 0 THEN
        INSERT INTO notificacion(
            usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
        )
        VALUES (
            p_usuario_id, 'solicitud_especial',
            'Tu solicitud especial está pendiente debido a conflicto con otra reserva o solicitud.',
            NOW(), FALSE, FALSE, v_nueva_solicitud_id, 'solicitud_especial'
        );
    ELSE
        -- No hay conflicto, se puede mantener estado 'pendiente' o cambiar a 'aprobada' según lógica deseada
        UPDATE solicitud_especial
        SET estado = 'pendiente'
        WHERE solicitud_especial_id = v_nueva_solicitud_id;
    END IF;

END;

DROP PROCEDURE IF EXISTS aprobar_solicitud_especial;
CREATE PROCEDURE aprobar_solicitud_especial(
    IN p_solicitud_especial_id INT
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_hora TIME;
    DECLARE v_hora_fin TIME;
    DECLARE v_espacio_id INT;
    DECLARE v_fecha DATE;

    -- Obtener datos de la solicitud especial
    SELECT usuario_id, hora_inicio, hora_fin, espacio_id, fecha
    INTO v_usuario_id, v_hora, v_hora_fin, v_espacio_id, v_fecha
    FROM solicitud_especial
    WHERE solicitud_especial_id = p_solicitud_especial_id;

    -- Aprobar la solicitud especial
    UPDATE solicitud_especial
    SET estado = 'aprobada'
    WHERE solicitud_especial_id = p_solicitud_especial_id;

    -- Notificar al usuario de la solicitud especial
    IF NOT EXISTS (
        SELECT 1 FROM notificacion
        WHERE usuario_id = v_usuario_id
          AND relacion_id = p_solicitud_especial_id
          AND relacion_tipo = 'solicitud_especial'
          AND mensaje LIKE 'Tu solicitud especial ha sido aprobada'
    ) THEN
        INSERT INTO notificacion(
            usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
        )
        VALUES (
            v_usuario_id,
            'solicitud_especial',
            'Tu solicitud especial ha sido aprobada.',
            NOW(), FALSE, FALSE,
            p_solicitud_especial_id,
            'solicitud_especial'
        );
    END IF;

    -- Notificar a los usuarios afectados (solicitudes normales o especiales) y eliminar sus reservas
    INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
    SELECT DISTINCT s.usuario_id,
        'solicitud',
        'Tu solicitud tuvo que ser removida debido a un evento especial aprobado.',
        NOW(),
        FALSE,
        FALSE,
        s.solicitud_id,
        'solicitud'
    FROM reserva r
    JOIN (
        -- Traer solicitudes normales en conflicto
        SELECT s1.solicitud_id, s1.usuario_id
        FROM solicitud s1
        WHERE s1.estado IN ('pendiente','aprobada')
        UNION
        -- Traer solicitudes especiales en conflicto distintas a la que estamos aprobando
        SELECT s2.solicitud_especial_id AS solicitud_id, s2.usuario_id
        FROM solicitud_especial s2
        WHERE s2.solicitud_especial_id <> p_solicitud_especial_id
          AND s2.estado IN ('pendiente','aprobada')
    ) AS s ON ( (r.solicitud_id = s.solicitud_id) OR (r.solicitud_especial_id = s.solicitud_id) )
    WHERE r.espacio_id = v_espacio_id
      AND r.fecha = v_fecha
      AND r.hora_inicio < v_hora_fin
      AND r.hora_fin > v_hora
      AND NOT EXISTS (
          SELECT 1
          FROM notificacion n
          WHERE n.usuario_id = s.usuario_id
            AND n.relacion_id = s.solicitud_id
            AND n.relacion_tipo = 'solicitud'
            AND n.mensaje LIKE 'Tu solicitud  tuvo que ser removida'
      );

    -- Eliminar reservas en conflicto (normales y especiales)
    DELETE r
    FROM reserva r
    WHERE r.espacio_id = v_espacio_id
      AND r.fecha = v_fecha
      AND r.hora_inicio < v_hora_fin
      AND r.hora_fin > v_hora;

    -- Solicitudes normales
    UPDATE solicitud s
    SET estado = 'rechazada'
    WHERE s.estado IN ('pendiente','aprobada')
      AND NOT EXISTS (
          SELECT 1 FROM reserva r WHERE r.solicitud_id = s.solicitud_id
      );

    -- Solicitudes especiales (distintas a la aprobada)
    UPDATE solicitud_especial se
    SET estado = 'rechazada'
    WHERE se.solicitud_especial_id <> p_solicitud_especial_id
      AND se.estado IN ('pendiente','aprobada')
      AND NOT EXISTS (
          SELECT 1 FROM reserva r WHERE r.solicitud_especial_id = se.solicitud_especial_id
      );

    -- Insertar reservas por hora para la solicitud especial aprobada
    WHILE v_hora < v_hora_fin DO
        INSERT INTO reserva(espacio_id, fecha, hora_inicio, hora_fin, solicitud_especial_id)
        VALUES (
            v_espacio_id,
            v_fecha,
            v_hora,
            ADDTIME(v_hora, '01:00:00'),
            p_solicitud_especial_id
        );
        SET v_hora = ADDTIME(v_hora, '01:00:00');
    END WHILE;

END;


DROP PROCEDURE IF EXISTS rechazar_solicitud_especial;
CREATE PROCEDURE rechazar_solicitud_especial(
    IN p_solicitud_especial_id INT
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_reservas_existentes INT;

    -- Obtener usuario de la solicitud especial
    SELECT usuario_id
    INTO v_usuario_id
    FROM solicitud_especial
    WHERE solicitud_especial_id = p_solicitud_especial_id;

    -- Verificar si la solicitud tiene reservas
    SELECT COUNT(*)
    INTO v_reservas_existentes
    FROM reserva
    WHERE solicitud_especial_id = p_solicitud_especial_id;

    -- Si hay reservas (solicitud aprobada)
    IF v_reservas_existentes > 0 THEN
        -- Eliminar reservas asociadas
        DELETE FROM reserva
        WHERE solicitud_especial_id = p_solicitud_especial_id;

        -- Cambiar estado a rechazada
        UPDATE solicitud_especial
        SET estado = 'rechazada'
        WHERE solicitud_especial_id = p_solicitud_especial_id;

        -- Insertar notificación de rechazo
        IF NOT EXISTS (
            SELECT 1
            FROM notificacion
            WHERE usuario_id = v_usuario_id
              AND relacion_id = p_solicitud_especial_id
              AND relacion_tipo = 'solicitud_especial'
              AND mensaje LIKE 'Tu solicitud especial  ha sido rechazada'
        ) THEN
            INSERT INTO notificacion(
                usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
            )
            VALUES (
                v_usuario_id,
                'solicitud_especial',
                'Tu solicitud especial ha sido rechazada.',
                NOW(),
                FALSE,
                FALSE,
                p_solicitud_especial_id,
                'solicitud_especial'
            );
        END IF;

    ELSE
        -- Solicitud pendiente sin reservas, solo cambiar estado y notificar
        UPDATE solicitud_especial
        SET estado = 'rechazada'
        WHERE solicitud_especial_id = p_solicitud_especial_id;

        -- Insertar notificación de rechazo
        IF NOT EXISTS (
            SELECT 1
            FROM notificacion
            WHERE usuario_id = v_usuario_id
              AND relacion_id = p_solicitud_especial_id
              AND relacion_tipo = 'solicitud_especial'
              AND mensaje LIKE 'Tu solicitud especial ha sido rechazada'
        ) THEN
            INSERT INTO notificacion(
                usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
            )
            VALUES (
                v_usuario_id,
                'solicitud_especial',
                'Tu solicitud especial ha sido rechazada.',
                NOW(),
                FALSE,
                FALSE,
                p_solicitud_especial_id,
                'solicitud_especial'
            );
        END IF;
    END IF;

END;


DROP PROCEDURE IF EXISTS insertar_reporte_dano;
CREATE PROCEDURE insertar_reporte_dano(
    IN p_usuario_id INT,
    IN p_inventario_id INT,
    IN p_descripcion TEXT
)
BEGIN
    DECLARE v_admin_id INT;
    DECLARE v_reporte_id INT;
    DECLARE v_existente INT;

    -- 0. Verificar si ya existe un reporte pendiente o en proceso para este inventario
    SELECT COUNT(*) INTO v_existente
    FROM reporte_dano
    WHERE inventario_id = p_inventario_id
      AND estado IN ('pendiente', 'en_proceso');

    IF v_existente > 0 THEN
        -- Ya hay un reporte pendiente/en proceso, se cancela la operación
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya existe un reporte pendiente o en proceso para este inventario';
    ELSE
        -- 1. Insertar el reporte
        INSERT INTO reporte_dano (usuario_id, inventario_id, descripcion)
        VALUES (p_usuario_id, p_inventario_id, p_descripcion);

        -- Guardar el ID insertado
        SET v_reporte_id = LAST_INSERT_ID();

        -- 2. Cambiar estado del inventario a 'desactivado'
        UPDATE inventario
        SET estado = 'desactivado'
        WHERE inventario_id = p_inventario_id;

        -- 3. Obtener el primer administrador
        SELECT usuario_id INTO v_admin_id
        FROM usuario
        WHERE rol = 'administrador' AND activo = TRUE
        ORDER BY usuario_id ASC
        LIMIT 1;

        -- 4. Crear notificación para el usuario que hizo el reporte
        INSERT INTO notificacion (usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo)
        VALUES (
            p_usuario_id,
            'reporte',
            'Tu reporte ha sido enviado y está a la espera de resolución.',
            FALSE,
            FALSE,
            v_reporte_id,
            'reporte_dano'
        );

        -- 5. Crear notificación para el administrador
        IF v_admin_id IS NOT NULL THEN
            INSERT INTO notificacion (usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo)
            VALUES (
                v_admin_id,
                'reporte',
                'Se ha recibido un nuevo reporte. Se esperan acciones.',
                FALSE,
                FALSE,
                v_reporte_id,
                'reporte_dano'
            );
        END IF;
    END IF;

END;


DROP PROCEDURE IF EXISTS rechazar_reporte_danio;
CREATE PROCEDURE rechazar_reporte_danio (
    IN p_reporte_id INT
)
BEGIN
    DECLARE v_inventario_id INT;
    DECLARE v_usuario_id INT;
    DECLARE v_admin_id INT;

    -- Obtener inventario and usuario asociado al reporte
    SELECT inventario_id, usuario_id
    INTO v_inventario_id, v_usuario_id
    FROM reporte_dano
    WHERE reporte_id = p_reporte_id;

    -- Validar que el reporte exista
    IF v_inventario_id IS NOT NULL THEN

        -- Cambiar estado del reporte a "rechazado"
        UPDATE reporte_dano
        SET estado = 'rechazado'
        WHERE reporte_id = p_reporte_id;

        -- Cambiar inventario a "operativo" nuevamente
        UPDATE inventario
        SET estado = 'operativo'
        WHERE inventario_id = v_inventario_id;

        -- Obtener el primer administrador activo
        SELECT usuario_id INTO v_admin_id
        FROM usuario
        WHERE rol = 'administrador' AND activo = TRUE
        ORDER BY usuario_id ASC
        LIMIT 1;

        -- Notificación al usuario que hizo el reporte
        INSERT INTO notificacion (usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo)
        VALUES (
            v_usuario_id,
            'reporte',
            'Tu reporte ha sido cancelado/rechazado.',
            FALSE,
            FALSE,
            p_reporte_id,
            'reporte_dano'
        );

        -- Notificación al administrador
        IF v_admin_id IS NOT NULL THEN
            INSERT INTO notificacion (usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo)
            VALUES (
                v_admin_id,
                'reporte',
                'El reporte ha sido cancelado/rechazado.',
                FALSE,
                FALSE,
                p_reporte_id,
                'reporte_dano'
            );
        END IF;

    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El reporte de daño no existe o no tiene inventario asociado';
    END IF;
END;


DROP PROCEDURE IF EXISTS insertar_mantenimiento;
CREATE PROCEDURE insertar_mantenimiento(
    IN p_usuario_mantenimiento_id INT,
    IN p_reporte_id INT,
    IN p_tipo VARCHAR(20),
    IN p_fecha_programada DATE,
    IN p_descripcion TEXT
)
BEGIN
    DECLARE v_usuario_reporte INT;
    DECLARE v_inventario_id INT;
    DECLARE v_mantenimiento_id INT;
    DECLARE v_existente INT;
    DECLARE v_estado_reporte VARCHAR(20);

    -- Obtener inventario, usuario y estado del reporte
    SELECT inventario_id, usuario_id, estado 
    INTO v_inventario_id, v_usuario_reporte, v_estado_reporte
    FROM reporte_dano
    WHERE reporte_id = p_reporte_id;

    -- Si el reporte no existe o está rechazado, terminar el procedimiento
    IF v_inventario_id IS NOT NULL AND v_estado_reporte <> 'rechazado' THEN

        -- Verificar si ya existe mantenimiento pendiente o en proceso para este reporte
        SELECT COUNT(*) INTO v_existente
        FROM mantenimiento
        WHERE reporte_id = p_reporte_id AND estado IN ('pendiente','en_proceso');

        IF v_existente = 0 THEN
            -- Insertar mantenimiento
            INSERT INTO mantenimiento (reporte_id, usuario_id, tipo, fecha_programada, descripcion, estado)
            VALUES (p_reporte_id, p_usuario_mantenimiento_id, p_tipo, p_fecha_programada, p_descripcion, 'pendiente');

            SET v_mantenimiento_id = LAST_INSERT_ID();

            -- Actualizar estado del reporte a 'en_proceso'
            UPDATE reporte_dano
            SET estado = 'en_proceso'
            WHERE reporte_id = p_reporte_id;

            -- Actualizar estado del inventario a 'en_reparacion'
            UPDATE inventario
            SET estado = 'en_reparacion'
            WHERE inventario_id = v_inventario_id;

            -- Notificación para el usuario que reportó
            INSERT INTO notificacion (usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo)
            VALUES (
                v_usuario_reporte,
                'reporte',
                'Tu reporte ya está siendo atendido mediante un mantenimiento.',
                FALSE,
                FALSE,
                p_reporte_id,
                'reporte_dano'
            );

            -- Notificación para el usuario que registró el mantenimiento
            INSERT INTO notificacion (usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo)
            VALUES (
                p_usuario_mantenimiento_id,
                'mantenimiento',
                'El mantenimiento fue insertado correctamente.',
                FALSE,
                FALSE,
                v_mantenimiento_id,
                'mantenimiento'
            );
        END IF;
    END IF;

END;


DROP PROCEDURE IF EXISTS completar_mantenimiento;
CREATE PROCEDURE completar_mantenimiento(
    IN p_mantenimiento_id INT,
    IN p_fecha_completado DATE,
    IN p_costo DECIMAL(10,2)
)
BEGIN
    DECLARE v_reporte_id INT;
    DECLARE v_inventario_id INT;
    DECLARE v_usuario_reporte INT;
    DECLARE v_usuario_mantenimiento INT;
    DECLARE v_estado_actual VARCHAR(20);

    proc_block: BEGIN
        SELECT reporte_id, usuario_id, estado 
        INTO v_reporte_id, v_usuario_mantenimiento, v_estado_actual
        FROM mantenimiento
        WHERE mantenimiento_id = p_mantenimiento_id;

        IF v_estado_actual = 'completado' THEN
            LEAVE proc_block;
        END IF;

        SELECT inventario_id, usuario_id 
        INTO v_inventario_id, v_usuario_reporte
        FROM reporte_dano
        WHERE reporte_id = v_reporte_id;

        UPDATE mantenimiento
        SET fecha_completado = p_fecha_completado,
            costo = p_costo,
            estado = 'completado'
        WHERE mantenimiento_id = p_mantenimiento_id;

        UPDATE reporte_dano
        SET estado = 'reparado'
        WHERE reporte_id = v_reporte_id;

        UPDATE inventario
        SET estado = 'operativo'
        WHERE inventario_id = v_inventario_id;

        -- Notificaciones sin concatenar ID
        INSERT INTO notificacion (usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo)
        VALUES (
            v_usuario_mantenimiento,
            'mantenimiento',
            'El mantenimiento ha sido completado.',
            FALSE,
            FALSE,
            p_mantenimiento_id,
            'mantenimiento'
        );

        INSERT INTO notificacion (usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo)
        VALUES (
            v_usuario_reporte,
            'reporte',
            'Tu reporte ya ha sido reparado y completado.',
            FALSE,
            FALSE,
            v_reporte_id,
            'reporte_dano'
        );
    END proc_block;
END;


DROP PROCEDURE IF EXISTS cancelar_mantenimiento;
CREATE PROCEDURE cancelar_mantenimiento(
    IN p_mantenimiento_id INT
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_estado_actual VARCHAR(50);

    SELECT usuario_id, estado
    INTO v_usuario_id, v_estado_actual
    FROM mantenimiento
    WHERE mantenimiento_id = p_mantenimiento_id;

    IF v_usuario_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El mantenimiento no existe';
    ELSE
        IF v_estado_actual <> 'cancelado' THEN
            UPDATE mantenimiento
            SET estado = 'cancelado'
            WHERE mantenimiento_id = p_mantenimiento_id;

            -- Notificación sin concatenar ID
            INSERT INTO notificacion (
                usuario_id, tipo, mensaje, enviado, leida, relacion_id, relacion_tipo
            ) VALUES (
                v_usuario_id,
                'mantenimiento',
                'El mantenimiento ha sido cancelado.',
                FALSE,
                FALSE,
                p_mantenimiento_id,
                'mantenimiento'
            );
        END IF;
    END IF;
END;

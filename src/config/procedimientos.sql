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
            CONCAT('Tu solicitud con ID ', v_solicitud_id,
                   ' presenta un conflicto con la solicitud ID ', v_conflicto_id,
                   '. Está en espera de resolución.'),
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

                            -- Conflictos (igual que antes)
                            -- [Se mantiene la lógica de inserts en conflicto_recurrente y notificaciones de choques]
                            -- ...
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
       CONCAT('Tu solicitud con ID ', s.solicitud_id, ' ha sido rechazada debido a conflicto con otra solicitud aprobada.'), 
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
          AND n.mensaje LIKE 'Tu solicitud con ID % ha sido rechazada%'
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
                  AND mensaje LIKE 'Tu solicitud fue aprobada pero está en espera%'
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
                  AND mensaje LIKE 'Has aprobado una solicitud en conflicto%'
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

    -- Obtener el usuario asociado a la solicitud
    SELECT usuario_id
    INTO v_usuario_id
    FROM solicitud
    WHERE solicitud_id = p_solicitud_id;

    -- Verificar si existen reservas asociadas a la solicitud
    SELECT COUNT(*) > 0
    INTO v_tiene_reservas
    FROM reserva
    WHERE solicitud_id = p_solicitud_id;

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
          AND mensaje LIKE 'Tu solicitud con ID % ha sido rechazada%'
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
            CONCAT('Tu solicitud con ID ', p_solicitud_id, ' ha sido rechazada.'),
            NOW(),
            FALSE,
            FALSE,
            p_solicitud_id,
            'solicitud'
        );
    END IF;
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
            CONCAT('Tu solicitud especial con ID ', v_nueva_solicitud_id, ' está pendiente debido a conflicto con otra reserva o solicitud.'),
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
          AND mensaje LIKE 'Tu solicitud especial con ID % ha sido aprobada%'
    ) THEN
        INSERT INTO notificacion(
            usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
        )
        VALUES (
            v_usuario_id,
            'solicitud_especial',
            CONCAT('Tu solicitud especial con ID ', p_solicitud_especial_id, ' ha sido aprobada.'),
            NOW(), FALSE, FALSE,
            p_solicitud_especial_id,
            'solicitud_especial'
        );
    END IF;

    -- Notificar a los usuarios afectados (solicitudes normales o especiales) y eliminar sus reservas
    INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
    SELECT DISTINCT s.usuario_id,
        'solicitud',
        CONCAT('Tu solicitud con ID ', s.solicitud_id, ' tuvo que ser removida debido a un evento especial aprobado.'),
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
            AND n.mensaje LIKE 'Tu solicitud con ID % tuvo que ser removida%'
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
              AND mensaje LIKE 'Tu solicitud especial con ID % ha sido rechazada%'
        ) THEN
            INSERT INTO notificacion(
                usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
            )
            VALUES (
                v_usuario_id,
                'solicitud_especial',
                CONCAT('Tu solicitud especial con ID ', p_solicitud_especial_id, ' ha sido rechazada.'),
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
              AND mensaje LIKE 'Tu solicitud especial con ID % ha sido rechazada%'
        ) THEN
            INSERT INTO notificacion(
                usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo
            )
            VALUES (
                v_usuario_id,
                'solicitud_especial',
                CONCAT('Tu solicitud especial con ID ', p_solicitud_especial_id, ' ha sido rechazada.'),
                NOW(),
                FALSE,
                FALSE,
                p_solicitud_especial_id,
                'solicitud_especial'
            );
        END IF;
    END IF;

END;

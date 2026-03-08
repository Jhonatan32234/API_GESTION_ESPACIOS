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
    DECLARE v_existe_aprobada INT;
    DECLARE v_conflicto_pendiente INT;

    -- 1. Validar horario básico
    IF p_hora_inicio >= p_hora_fin THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VAL_ERR: La hora de inicio debe ser menor a la de fin.';
    END IF;

    -- 2. VALIDACIÓN CRÍTICA: Bloqueo de horario ya ocupado
    SELECT s.solicitud_id INTO v_existe_aprobada
    FROM solicitud s
    JOIN solicitud_horario sh ON s.solicitud_id = sh.solicitud_id
    WHERE s.espacio_id = p_espacio_id
      AND s.periodo_id = p_periodo_id
      AND s.estado = 'aprobada'
      AND (p_hora_inicio < sh.hora_fin AND p_hora_fin > sh.hora_inicio)
      AND JSON_CONTAINS(p_dias, CAST(sh.dia_semana AS JSON))
    LIMIT 1;

    IF v_existe_aprobada IS NOT NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CONF_ERR: El horario ya está ocupado por una solicitud aprobada.';
    END IF;

    -- 3. Inserción
    INSERT INTO solicitud(usuario_id, espacio_id, periodo_id, materia_id, grupo, motivo, cantidad_asistentes, estado)
    VALUES (p_usuario_id, p_espacio_id, p_periodo_id, p_materia_id, p_grupo, p_motivo, p_cantidad_asistentes, 'pendiente');

    SET v_solicitud_id = LAST_INSERT_ID();

    -- Loop de horarios
    WHILE done < JSON_LENGTH(p_dias) DO
        SET v_dia = JSON_EXTRACT(p_dias, CONCAT('$[', done, ']'));
        INSERT INTO solicitud_horario(solicitud_id, dia_semana, hora_inicio, hora_fin)
        VALUES(v_solicitud_id, v_dia, p_hora_inicio, p_hora_fin);
        SET done = done + 1;
    END WHILE;

    -- 4. Notificar conflicto con pendientes (sin bloquear la inserción)
    SELECT s.solicitud_id INTO v_conflicto_pendiente
    FROM solicitud s
    JOIN solicitud_horario sh1 ON s.solicitud_id = sh1.solicitud_id
    WHERE s.solicitud_id <> v_solicitud_id
      AND s.espacio_id = p_espacio_id
      AND s.estado = 'pendiente'
      AND sh1.dia_semana IN (SELECT dia_semana FROM solicitud_horario WHERE solicitud_id = v_solicitud_id)
      AND (sh1.hora_inicio < p_hora_fin AND sh1.hora_fin > p_hora_inicio)
    LIMIT 1;

    IF v_conflicto_pendiente IS NOT NULL THEN
        INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
        VALUES (p_usuario_id, 'solicitud', 'Tu solicitud tiene un posible conflicto con otra pendiente.', NOW(), FALSE, FALSE, v_solicitud_id, 'solicitud');
    END IF;

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
    DECLARE v_usuario_id INT;
    DECLARE done INT DEFAULT 0;

    -- Cursor para los horarios de la solicitud que queremos aprobar
    DECLARE cur_horarios CURSOR FOR
        SELECT dia_semana, hora_inicio, hora_fin
        FROM solicitud_horario
        WHERE solicitud_id = p_solicitud_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- 1. Obtener datos base y VALIDAR ESTADO
    SELECT estado, espacio_id, periodo_id, usuario_id
    INTO v_estado_actual, v_espacio, v_periodo, v_usuario_id
    FROM solicitud
    WHERE solicitud_id = p_solicitud_id;

    -- Salir si ya está aprobada (Evita duplicar reservas)
    IF v_estado_actual = 'aprobada' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: La solicitud ya está aprobada.';
    END IF;

    -- 2. Obtener fechas del periodo
    SELECT fecha_inicio, fecha_fin
    INTO v_fecha_inicio, v_fecha_fin
    FROM periodo
    WHERE periodo_id = v_periodo;

    -- INICIO DE OPERACIONES ATÓMICAS
    START TRANSACTION;

    -- 3. RECHAZO AUTOMÁTICO PREVENTIVO: 
    -- Rechazamos cualquier OTRA solicitud pendiente que choque con los horarios de ESTA
    UPDATE solicitud s_dest
    JOIN solicitud_horario sh_dest ON s_dest.solicitud_id = sh_dest.solicitud_id
    JOIN solicitud_horario sh_src  ON sh_src.solicitud_id = p_solicitud_id
    SET s_dest.estado = 'rechazada'
    WHERE s_dest.estado = 'pendiente'
      AND s_dest.solicitud_id <> p_solicitud_id
      AND s_dest.espacio_id = v_espacio
      AND s_dest.periodo_id = v_periodo
      AND sh_dest.dia_semana = sh_src.dia_semana
      AND (sh_dest.hora_inicio < sh_src.hora_fin AND sh_dest.hora_fin > sh_src.hora_inicio);

    -- 4. Notificar a los usuarios cuyas solicitudes fueron rechazadas por el paso anterior
    INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
    SELECT s.usuario_id, 'solicitud', 
           'Tu solicitud ha sido rechazada automáticamente debido a que se aprobó otra solicitud en el mismo horario.', 
           NOW(), FALSE, FALSE, s.solicitud_id, 'solicitud'
    FROM solicitud s
    WHERE s.estado = 'rechazada' 
      AND s.solicitud_id <> p_solicitud_id
      -- Solo notificar si no acabamos de enviar una notificación similar hoy
      AND NOT EXISTS (
          SELECT 1 FROM notificacion n 
          WHERE n.relacion_id = s.solicitud_id AND DATE(n.fecha_envio) = CURDATE()
      );

    -- 5. GENERAR RESERVAS EN EL CALENDARIO
    OPEN cur_horarios;
    leer_horarios: LOOP
        FETCH cur_horarios INTO v_dia, v_hi, v_hf;
        IF done THEN LEAVE leer_horarios; END IF;

        SET v_fecha = v_fecha_inicio;
        WHILE v_fecha <= v_fecha_fin DO
            -- WEEKDAY en MySQL: 0=Lunes, 1=Martes... 6=Domingo. 
            -- Si tu tabla usa 1=Lunes, sumamos 1.
            IF (WEEKDAY(v_fecha) + 1) = v_dia THEN
                -- Insertar bloques de 1 hora (o el bloque completo según tu preferencia)
                -- Aquí lo inserto como un solo bloque para eficiencia, 
                -- pero puedes mantener tu sub-loop de v_hora_actual si necesitas granularidad de 1h.
                INSERT INTO reserva(solicitud_id, espacio_id, fecha, hora_inicio, hora_fin)
                VALUES (p_solicitud_id, v_espacio, v_fecha, v_hi, v_hf);
            END IF;
            SET v_fecha = DATE_ADD(v_fecha, INTERVAL 1 DAY);
        END WHILE;
    END LOOP leer_horarios;
    CLOSE cur_horarios;

    -- 6. Marcar la solicitud actual como aprobada
    UPDATE solicitud SET estado = 'aprobada' WHERE solicitud_id = p_solicitud_id;

    -- 7. Notificación de éxito para el solicitante
    INSERT INTO notificacion(usuario_id, tipo, mensaje, fecha_envio, leida, enviado, relacion_id, relacion_tipo)
    VALUES (v_usuario_id, 'solicitud', '¡Felicidades! Tu solicitud ha sido aprobada.', NOW(), FALSE, FALSE, p_solicitud_id, 'solicitud');

    COMMIT;
END;


DROP PROCEDURE IF EXISTS rechazar_solicitud_normal;
CREATE PROCEDURE rechazar_solicitud_normal(IN p_solicitud_id INT)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_conflicto_count INT;

    -- Iniciar transacción
    START TRANSACTION;

    -- Verificar si la solicitud existe
    SELECT estado, usuario_id
    INTO v_estado_actual, v_usuario_id
    FROM solicitud
    WHERE solicitud_id = p_solicitud_id
    FOR UPDATE; -- Bloquear la fila

    IF v_usuario_id IS NULL THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45001' SET MESSAGE_TEXT = 'La solicitud no existe.';
    END IF;

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

    IF v_conflicto_count > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45002' SET MESSAGE_TEXT = 'No se puede rechazar. Existe un conflicto con otra solicitud aprobada que debe resolverse primero.';
    END IF;

    -- Si la solicitud estaba aprobada, eliminar sus reservas
    IF v_estado_actual = 'aprobada' THEN
        DELETE FROM reserva WHERE solicitud_id = p_solicitud_id;
    END IF;

    -- Marcar la solicitud como rechazada
    UPDATE solicitud
    SET estado = 'rechazada'
    WHERE solicitud_id = p_solicitud_id;

    -- Crear notificación al usuario
    IF NOT EXISTS (
        SELECT 1 FROM notificacion
        WHERE usuario_id = v_usuario_id AND relacion_id = p_solicitud_id AND relacion_tipo = 'solicitud' AND mensaje LIKE 'Tu solicitud ha sido rechazada%'
    ) THEN
        INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
        VALUES (v_usuario_id, 'solicitud', 'Tu solicitud ha sido rechazada.', p_solicitud_id, 'solicitud');
    END IF;

    -- Eliminar cualquier conflicto pendiente relacionado con esta solicitud
    DELETE FROM conflicto_recurrente
    WHERE estado = 'pendiente'
      AND (solicitud_id_1 = p_solicitud_id OR solicitud_id_2 = p_solicitud_id);

    -- Confirmar transacción
    COMMIT;

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

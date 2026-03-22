/* 1. INSERTAR SOLICITUD NORMAL */
DROP PROCEDURE IF EXISTS insertar_solicitud_normal
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
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_dia SMALLINT;
    DECLARE v_existe_aprobada INT;
    DECLARE v_conflicto_id INT;
    DECLARE v_nombre_espacio VARCHAR(60);

    SELECT nombre INTO v_nombre_espacio FROM espacio WHERE espacio_id = p_espacio_id;

    -- Validar horario
    IF p_hora_inicio >= p_hora_fin THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La hora de inicio debe ser menor a la de fin.';
    END IF;

    -- Verificar si ya hay algo aprobado en ese horario
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
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El horario ya está ocupado por una solicitud aprobada.';
    END IF;

    START TRANSACTION;

    INSERT INTO solicitud(usuario_id, espacio_id, periodo_id, materia_id, grupo, motivo, cantidad_asistentes, estado)
    VALUES (p_usuario_id, p_espacio_id, p_periodo_id, p_materia_id, p_grupo, p_motivo, p_cantidad_asistentes, 'pendiente');

    SET v_solicitud_id = LAST_INSERT_ID();

    WHILE v_count < JSON_LENGTH(p_dias) DO
        SET v_dia = JSON_EXTRACT(p_dias, CONCAT('$[', v_count, ']'));
        INSERT INTO solicitud_horario(solicitud_id, dia_semana, hora_inicio, hora_fin)
        VALUES(v_solicitud_id, v_dia, p_hora_inicio, p_hora_fin);
        SET v_count = v_count + 1;
    END WHILE;

    -- Buscar conflictos con otras PENDIENTES
    SELECT s.solicitud_id INTO v_conflicto_id
    FROM solicitud s
    JOIN solicitud_horario sh ON s.solicitud_id = sh.solicitud_id
    WHERE s.solicitud_id <> v_solicitud_id
      AND s.espacio_id = p_espacio_id
      AND s.estado = 'pendiente'
      AND JSON_CONTAINS(p_dias, CAST(sh.dia_semana AS JSON))
      AND (sh.hora_inicio < p_hora_fin AND sh.hora_fin > p_hora_inicio)
    LIMIT 1;

    INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
    VALUES (
        p_usuario_id, 
        IF(v_conflicto_id IS NOT NULL, 'alerta', 'exito'), 
        IF(v_conflicto_id IS NOT NULL, 
            CONCAT('Solicitud registrada para ', v_nombre_espacio, '. Existe un conflicto con otra pendiente.'),
            CONCAT('Solicitud enviada con éxito para ', v_nombre_espacio, '. Horario disponible.')), 
        v_solicitud_id, 'solicitud'
    );

    COMMIT;
    SELECT v_solicitud_id AS solicitud_id;
END;



DROP PROCEDURE IF EXISTS aprobar_solicitud_normal;
CREATE PROCEDURE aprobar_solicitud_normal(IN p_solicitud_id INT, IN p_admin_id INT)
BEGIN
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_espacio INT;
    DECLARE v_periodo INT;
    DECLARE v_fecha_inicio, v_fecha_fin, v_fecha DATE;
    DECLARE v_dia SMALLINT;
    DECLARE v_hi, v_hf, v_hora_aux TIME;
    DECLARE v_usuario_id INT;
    DECLARE v_nombre_espacio VARCHAR(60);
    DECLARE done INT DEFAULT 0;

    DECLARE cur_horarios CURSOR FOR 
        SELECT dia_semana, hora_inicio, hora_fin FROM solicitud_horario WHERE solicitud_id = p_solicitud_id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    -- 1. Obtener datos base
    SELECT s.estado, s.espacio_id, s.periodo_id, s.usuario_id, e.nombre
    INTO v_estado_actual, v_espacio, v_periodo, v_usuario_id, v_nombre_espacio
    FROM solicitud s
    JOIN espacio e ON s.espacio_id = e.espacio_id
    WHERE s.solicitud_id = p_solicitud_id;

    IF v_estado_actual <> 'pendiente' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La solicitud no está pendiente.';
    END IF;

    SELECT fecha_inicio, fecha_fin INTO v_fecha_inicio, v_fecha_fin FROM periodo WHERE periodo_id = v_periodo;

    START TRANSACTION;

    -- A. Crear tabla temporal para guardar a quiénes vamos a rechazar justo ahora
    CREATE TEMPORARY TABLE IF NOT EXISTS afectados_rechazo (sol_id INT);
    TRUNCATE TABLE afectados_rechazo;

    -- B. Identificar solicitudes en conflicto y guardarlas en la tabla temporal
    INSERT INTO afectados_rechazo (sol_id)
    SELECT DISTINCT s_dest.solicitud_id
    FROM solicitud s_dest
    WHERE s_dest.estado = 'pendiente'
      AND s_dest.solicitud_id <> p_solicitud_id
      AND s_dest.espacio_id = v_espacio
      AND EXISTS (
          SELECT 1 
          FROM solicitud_horario sh_dest
          JOIN solicitud_horario sh_src ON sh_src.solicitud_id = p_solicitud_id
          WHERE sh_dest.solicitud_id = s_dest.solicitud_id
            AND sh_dest.dia_semana = sh_src.dia_semana
            AND (sh_dest.hora_inicio < sh_src.hora_fin AND sh_dest.hora_fin > sh_src.hora_inicio)
      );

    -- C. Rechazar solo a los identificados
    UPDATE solicitud SET estado = 'rechazada' 
    WHERE solicitud_id IN (SELECT sol_id FROM afectados_rechazo);

    -- D. Notificar SOLO a los que acabamos de rechazar
    INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
    SELECT s.usuario_id, 'alerta', 
           CONCAT('Tu solicitud para ', v_nombre_espacio, ' fue rechazada (Horario ocupado por otra asignación).'),
           s.solicitud_id, 'solicitud'
    FROM solicitud s
    JOIN afectados_rechazo ar ON s.solicitud_id = ar.sol_id;

    -- E. Generar Reservas (Tu lógica de bucle original)
    OPEN cur_horarios;
    read_loop: LOOP
        FETCH cur_horarios INTO v_dia, v_hi, v_hf;
        IF done THEN LEAVE read_loop; END IF;
        SET v_fecha = v_fecha_inicio;
        WHILE v_fecha <= v_fecha_fin DO
            IF (WEEKDAY(v_fecha) + 1) = v_dia THEN
                SET v_hora_aux = v_hi;
                WHILE v_hora_aux < v_hf DO
                    INSERT INTO reserva(solicitud_id, espacio_id, fecha, hora_inicio, hora_fin)
                    VALUES (p_solicitud_id, v_espacio, v_fecha, v_hora_aux, ADDTIME(v_hora_aux, '01:00:00'));
                    SET v_hora_aux = ADDTIME(v_hora_aux, '01:00:00');
                END WHILE;
            END IF;
            SET v_fecha = DATE_ADD(v_fecha, INTERVAL 1 DAY);
        END WHILE;
    END LOOP;
    CLOSE cur_horarios;

    -- F. Aprobar la solicitud actual y notificar éxito
    UPDATE solicitud SET estado = 'aprobada' WHERE solicitud_id = p_solicitud_id;
    
    INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
    VALUES (v_usuario_id, 'exito', CONCAT('Tu solicitud para ', v_nombre_espacio, ' ha sido aprobada.'), p_solicitud_id, 'solicitud');

    DROP TEMPORARY TABLE afectados_rechazo;
    COMMIT;
END;



/* 3. RECHAZAR SOLICITUD NORMAL */
DROP PROCEDURE IF EXISTS rechazar_solicitud_normal
CREATE PROCEDURE rechazar_solicitud_normal(IN p_solicitud_id INT)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_nombre_espacio VARCHAR(60);

    SELECT usuario_id, e.nombre INTO v_usuario_id, v_nombre_espacio
    FROM solicitud s JOIN espacio e ON s.espacio_id = e.espacio_id 
    WHERE solicitud_id = p_solicitud_id;

    START TRANSACTION;
    DELETE FROM reserva WHERE solicitud_id = p_solicitud_id;
    UPDATE solicitud SET estado = 'rechazada' WHERE solicitud_id = p_solicitud_id;
    DELETE FROM conflicto_recurrente WHERE solicitud_id_1 = p_solicitud_id OR solicitud_id_2 = p_solicit_id;

    INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
    VALUES (v_usuario_id, 'alerta', CONCAT('Tu solicitud para ', v_nombre_espacio, ' fue rechazada.'), p_solicitud_id, 'solicitud');
    COMMIT;
END;

/* 4. APROBAR SOLICITUD ESPECIAL (Lógica de desplazamiento) */
DROP PROCEDURE IF EXISTS aprobar_solicitud_especial
CREATE PROCEDURE aprobar_solicitud_especial(IN p_solicitud_especial_id INT)
BEGIN
    DECLARE v_usuario_id, v_espacio_id INT;
    DECLARE v_hora_inicio, v_hora_fin, v_temp_hora TIME;
    DECLARE v_fecha DATE;
    DECLARE v_nombre_espacio VARCHAR(60);

    SELECT se.usuario_id, se.hora_inicio, se.hora_fin, se.espacio_id, se.fecha, e.nombre
    INTO v_usuario_id, v_hora_inicio, v_hora_fin, v_espacio_id, v_fecha, v_nombre_espacio
    FROM solicitud_especial se JOIN espacio e ON se.espacio_id = e.espacio_id
    WHERE se.solicitud_especial_id = p_solicitud_especial_id;

    START TRANSACTION;

    -- Notificar a afectados (Normales y Especiales anteriores)
    INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
    SELECT DISTINCT COALESCE(s.usuario_id, se_old.usuario_id), 'alerta',
           CONCAT('Reserva en ', v_nombre_espacio, ' el ', v_fecha, ' cancelada por evento prioritario.'),
           p_solicitud_especial_id, 'solicitud_especial'
    FROM reserva r
    LEFT JOIN solicitud s ON r.solicitud_id = s.solicitud_id
    LEFT JOIN solicitud_especial se_old ON r.solicitud_especial_id = se_old.solicitud_especial_id
    WHERE r.espacio_id = v_espacio_id AND r.fecha = v_fecha
      AND r.hora_inicio < v_hora_fin AND r.hora_fin > v_hora_inicio;

    DELETE FROM reserva WHERE espacio_id = v_espacio_id AND fecha = v_fecha
      AND hora_inicio < v_hora_fin AND hora_fin > v_hora_inicio;

    -- Rechazar solicitudes normales que quedaron sin reservas
    UPDATE solicitud s SET estado = 'rechazada'
    WHERE espacio_id = v_espacio_id AND estado = 'aprobada'
      AND NOT EXISTS (SELECT 1 FROM reserva r WHERE r.solicitud_id = s.solicitud_id);

    UPDATE solicitud_especial SET estado = 'aprobada' WHERE solicitud_especial_id = p_solicitud_especial_id;

    SET v_temp_hora = v_hora_inicio;
    WHILE v_temp_hora < v_hora_fin DO
        INSERT INTO reserva(espacio_id, fecha, hora_inicio, hora_fin, solicitud_especial_id)
        VALUES (v_espacio_id, v_fecha, v_temp_hora, ADDTIME(v_temp_hora, '01:00:00'), p_solicitud_especial_id);
        SET v_temp_hora = ADDTIME(v_temp_hora, '01:00:00');
    END WHILE;

    INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
    VALUES (v_usuario_id, 'exito', CONCAT('Tu solicitud especial para ', v_nombre_espacio, ' fue aprobada.'), p_solicitud_especial_id, 'solicitud_especial');

    COMMIT;
END;


DROP PROCEDURE IF EXISTS insertar_solicitud_especial
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
    DECLARE v_nueva_id INT;
    DECLARE v_nombre_espacio VARCHAR(60);

    -- 1. Validar horas
    IF p_hora_inicio >= p_hora_fin THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La hora de inicio debe ser menor a la de fin.';
    END IF;

    -- 2. Obtener nombre del espacio
    SELECT nombre INTO v_nombre_espacio FROM espacio WHERE espacio_id = p_espacio_id;

    START TRANSACTION;

    -- 3. Insertar la solicitud especial
    INSERT INTO solicitud_especial(
        usuario_id, espacio_id, fecha, motivo, cantidad_asistentes, hora_inicio, hora_fin, estado
    )
    VALUES (
        p_usuario_id, p_espacio_id, p_fecha, p_motivo, p_cantidad_asistentes, p_hora_inicio, p_hora_fin, 'pendiente'
    );

    SET v_nueva_id = LAST_INSERT_ID();

    -- 4. Verificar conflictos con RESERVAS existentes (de cualquier tipo)
    SELECT COUNT(*) INTO v_conflicto
    FROM reserva r
    WHERE r.espacio_id = p_espacio_id
      AND r.fecha = p_fecha
      AND r.hora_inicio < p_hora_fin
      AND r.hora_fin > p_hora_inicio;

    -- 5. Notificación inicial
    -- Si v_conflicto > 0, avisamos que el administrador tendrá que desplazar a otros.
    INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
    VALUES (
        p_usuario_id, 
        IF(v_conflicto > 0, 'alerta', 'exito'), 
        IF(v_conflicto > 0, 
            CONCAT('Tu solicitud especial para ', v_nombre_espacio, ' tiene un conflicto. El administrador deberá aprobarla para desplazar las reservas actuales.'),
            CONCAT('Solicitud especial registrada para ', v_nombre_espacio, '. El horario está libre.')), 
        v_nueva_id, 'solicitud_especial'
    );

    COMMIT;

    SELECT v_nueva_id AS solicitud_especial_id;
END;


DROP PROCEDURE IF EXISTS rechazar_solicitud_especial
CREATE PROCEDURE rechazar_solicitud_especial(
    IN p_solicitud_especial_id INT
)
BEGIN
    DECLARE v_usuario_id INT;
    DECLARE v_estado_actual VARCHAR(20);
    DECLARE v_nombre_espacio VARCHAR(60);

    -- 1. Obtener datos y validar existencia
    SELECT se.usuario_id, se.estado, e.nombre
    INTO v_usuario_id, v_estado_actual, v_nombre_espacio
    FROM solicitud_especial se
    JOIN espacio e ON se.espacio_id = e.espacio_id
    WHERE se.solicitud_especial_id = p_solicitud_especial_id;

    IF v_usuario_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La solicitud especial no existe.';
    END IF;

    START TRANSACTION;

    -- 2. Limpieza de Reservas (si estaba aprobada)
    DELETE FROM reserva WHERE solicitud_especial_id = p_solicitud_especial_id;

    -- 3. Marcar como rechazada
    UPDATE solicitud_especial
    SET estado = 'rechazada'
    WHERE solicitud_especial_id = p_solicitud_especial_id;

    -- 4. Notificación al docente
    INSERT INTO notificacion(usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
    VALUES (
        v_usuario_id, 
        'alerta', 
        CONCAT('Tu solicitud especial para ', v_nombre_espacio, ' ha sido rechazada por la administración.'), 
        p_solicitud_especial_id, 
        'solicitud_especial'
    );

    COMMIT;
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

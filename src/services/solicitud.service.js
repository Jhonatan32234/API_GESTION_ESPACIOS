const AppDataSource = require("../config/ormconfig"); 

class SolicitudService {

async aprobarSolicitud(solicitud_id, usuario_id) {
    // 1. Obtener datos de la solicitud actual para verificar estado y conflictos
    const solicitudActual = await AppDataSource.query(
        `SELECT estado, espacio_id, periodo_id FROM solicitud WHERE solicitud_id = ?`,
        [solicitud_id]
    );

    if (solicitudActual.length === 0) {
        throw new Error("La solicitud no existe.");
    }

    if (solicitudActual[0].estado === 'aprobada') {
        throw new Error("Esta solicitud ya se encuentra aprobada.");
    }

    if (solicitudActual[0].estado === 'rechazada') {
        throw new Error("No se puede aprobar una solicitud que ya fue rechazada.");
    }

    // 2. Verificar si el horario se ocupó mientras esta solicitud estaba pendiente
    const conflictoAprobado = await AppDataSource.query(`
        SELECT s.solicitud_id 
        FROM solicitud s
        JOIN solicitud_horario sh_aprobada ON s.solicitud_id = sh_aprobada.solicitud_id
        JOIN solicitud_horario sh_actual ON sh_actual.solicitud_id = ?
        WHERE s.espacio_id = ? 
          AND s.periodo_id = ?
          AND s.estado = 'aprobada'
          AND sh_aprobada.dia_semana = sh_actual.dia_semana
          AND (sh_aprobada.hora_inicio < sh_actual.hora_fin AND sh_aprobada.hora_fin > sh_actual.hora_inicio)
        LIMIT 1
    `, [solicitud_id, solicitudActual[0].espacio_id, solicitudActual[0].periodo_id]);

    if (conflictoAprobado.length > 0) {
        throw new Error("No se puede aprobar: Otro usuario ya ocupa este horario.");
    }

    // 3. Si todo está bien, proceder con el STORED PROCEDURE
    const result = await AppDataSource.query(
        `CALL aprobar_solicitud_normal(?, ?)`,
        [solicitud_id, usuario_id]
    );
    
    return result;
}

async rechazarSolicitudNormal(solicitud_id) {
  try {
    const result = await AppDataSource.query(
      `CALL rechazar_solicitud_normal(?)`,
      [solicitud_id]
    );
    return result;
  } catch (error) {
    if (error.code === 'ER_SIGNAL_EXCEPTION') {
      if (error.sqlMessage.includes('La solicitud no existe')) {
        throw new Error('SOLICITUD_NO_EXISTE: ' + error.sqlMessage);
      }
      if (error.sqlMessage.includes('No se puede rechazar')) {
        throw new Error('CONFLICTO_APROBADAS: ' + error.sqlMessage);
      }
    }
    console.error("Error en rechazarSolicitudNormal:", error);
    throw new Error('ERROR_BASE_DATOS: Ocurrió un error al procesar la solicitud en la base de datos.');
  }
}


async obtenerHorarioPorEspacio(espacio_id) {
  const periodoService = require("./periodo.service");
  const periodoActivo = await periodoService.getPeriodoActivo();
  
  if (!periodoActivo) {
    throw new Error("No hay un periodo activo configurado");
  }

  // Consulta para obtener las reservas
  const query = `
    SELECT 
      sh.dia_semana,
      TIME_FORMAT(sh.hora_inicio, '%H:%i') as hora_inicio,
      TIME_FORMAT(sh.hora_fin, '%H:%i') as hora_fin
    FROM solicitud s
    INNER JOIN solicitud_horario sh ON s.solicitud_id = sh.solicitud_id
    LEFT JOIN materia m ON s.materia_id = m.materia_id
    WHERE s.espacio_id = ?
      AND s.periodo_id = ?
      AND s.estado = 'aprobada'
      AND sh.dia_semana BETWEEN 1 AND 5
    ORDER BY sh.dia_semana, sh.hora_inicio
  `;

  const resultados = await AppDataSource.query(query, [
    espacio_id, 
    periodoActivo.periodo_id
  ]);

  // Función para generar horas individuales
  const generarHorasIndividuales = (hora_inicio, hora_fin) => {
    const horas = [];
    const inicio = new Date(`2000-01-01T${hora_inicio}:00`);
    const fin = new Date(`2000-01-01T${hora_fin}:00`);
    
    // Restar una hora porque queremos el inicio de cada bloque
    let horaActual = new Date(inicio);
    
    while (horaActual < fin) {
      const horaStr = horaActual.toTimeString().slice(0, 5); // Formato HH:mm
      horas.push(horaStr);
      // Incrementar en 1 hora
      horaActual.setHours(horaActual.getHours() + 1);
    }
    
    return horas;
  };

  const horarioPorDia = {
    1: [], // Lunes
    2: [], // Martes
    3: [], // Miércoles
    4: [], // Jueves
    5: []  // Viernes
  };

  resultados.forEach(reserva => {
    const dia = reserva.dia_semana;
    const horasIndividuales = generarHorasIndividuales(reserva.hora_inicio, reserva.hora_fin);
    
    horasIndividuales.forEach(hora => {
      horarioPorDia[dia].push({
        hora: hora
      });
    });
  });

  // Eliminar duplicados por hora (si hay solapamientos)
  Object.keys(horarioPorDia).forEach(dia => {
    const horasUnicas = [];
    const horasVistas = new Set();
    
    horarioPorDia[dia].forEach(item => {
      if (!horasVistas.has(item.hora)) {
        horasVistas.add(item.hora);
        horasUnicas.push(item);
      }
    });
    
    horarioPorDia[dia] = horasUnicas.sort((a, b) => a.hora.localeCompare(b.hora));
  });

  const diasSemana = {
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes'
  };

  const respuesta = {
    espacio_id: parseInt(espacio_id),
    periodo_id: periodoActivo.periodo_id
  };

  // Agregar solo los días que tienen reservas
  Object.keys(horarioPorDia).forEach(diaNum => {
    if (horarioPorDia[diaNum].length > 0) {
      const nombreDia = diasSemana[diaNum];
      respuesta[nombreDia] = horarioPorDia[diaNum];
    }
  });

  return respuesta;
}

async getSolicitudesNormalesPorUsuario(usuario_id) {
  const result = await AppDataSource.query(`
      SELECT 
      s.solicitud_id,
      s.usuario_id,
      s.cantidad_asistentes,
      u.nombre AS usuario,
      e.nombre AS espacio,
      m.nombre AS materia,
      s.grupo,
      s.motivo,
      s.estado,
      s.fecha_creacion,
      sh.hora_inicio,
      sh.hora_fin
    FROM solicitud s
    LEFT JOIN usuario u ON u.usuario_id = s.usuario_id
    LEFT JOIN espacio e ON e.espacio_id = s.espacio_id
    LEFT JOIN periodo p ON p.periodo_id = s.periodo_id
    LEFT JOIN materia m ON m.materia_id = s.materia_id
    LEFT JOIN solicitud_horario sh ON sh.solicitud_id = s.solicitud_id
    WHERE s.usuario_id = ?
    ORDER BY s.fecha_creacion DESC, sh.hora_inicio ASC
  `, [usuario_id]);

  return result;
}


  async insertarSolicitudNormal(data) {
  try {
    const result = await AppDataSource.query(
      `CALL insertar_solicitud_normal(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.usuario_id,
        data.espacio_id,
        data.periodo_id,
        data.materia_id,
        data.grupo,
        data.motivo,
        data.cantidad_asistentes,
        JSON.stringify(data.dias),
        data.hora_inicio,
        data.hora_fin
      ]
    );

    // El ID de la solicitud suele venir en result[0][0]
    return result[0][0]; 
  } catch (error) {
    // Relanzamos el error para que el controller lo maneje
    throw error;
  }
}

async getSolicitudesConConflicto() {
  const query = `
    SELECT
        s.solicitud_id,
        s.grupo,
        s.motivo,
        s.estado,
        s.fecha_creacion,
        e.espacio_id,
        e.nombre AS espacio_nombre,
        u.usuario_id,
        u.nombre AS usuario_nombre,
        (
            SELECT GROUP_CONCAT(
              CONCAT(
                CASE sh.dia_semana
                  WHEN 1 THEN 'Lun' WHEN 2 THEN 'Mar' WHEN 3 THEN 'Mié'
                  WHEN 4 THEN 'Jue' WHEN 5 THEN 'Vie' WHEN 6 THEN 'Sáb'
                  WHEN 7 THEN 'Dom'
                END,
                ' ', TIME_FORMAT(sh.hora_inicio, '%H:%i'), '-', TIME_FORMAT(sh.hora_fin, '%H:%i')
              ) SEPARATOR '; '
            )
            FROM solicitud_horario sh
            WHERE sh.solicitud_id = s.solicitud_id
        ) AS horarios
    FROM
        solicitud s
    JOIN
        espacio e ON s.espacio_id = e.espacio_id
    JOIN
        usuario u ON s.usuario_id = u.usuario_id
    WHERE
        s.solicitud_id IN (
            SELECT DISTINCT s1.solicitud_id
            FROM solicitud s1
            JOIN solicitud_horario sh1 ON s1.solicitud_id = sh1.solicitud_id
            WHERE s1.estado IN ('pendiente', 'aprobada')
              AND EXISTS (
                SELECT 1
                FROM solicitud s2
                JOIN solicitud_horario sh2 ON s2.solicitud_id = sh2.solicitud_id
                WHERE s2.espacio_id = s1.espacio_id
                  AND s2.solicitud_id <> s1.solicitud_id
                  AND s2.estado IN ('pendiente', 'aprobada')
                  AND sh1.dia_semana = sh2.dia_semana
                  AND (sh1.hora_inicio < sh2.hora_fin AND sh1.hora_fin > sh2.hora_inicio)
              )
        )
    ORDER BY
        e.nombre, s.fecha_creacion;
  `;

  const solicitudesEnConflicto = await AppDataSource.query(query);

  // Agrupar por espacio
  const espaciosConConflictos = {};
  solicitudesEnConflicto.forEach(solicitud => {
    const { espacio_id, espacio_nombre, ...solicitudData } = solicitud;
    if (!espaciosConConflictos[espacio_id]) {
      espaciosConConflictos[espacio_id] = {
        espacio_id,
        espacio_nombre,
        solicitudes_en_conflicto: []
      };
    }
    espaciosConConflictos[espacio_id].solicitudes_en_conflicto.push(solicitudData);
  });

  return Object.values(espaciosConConflictos);
}




async getCalendarioPorPeriodo(espacio_id, periodo_id = null) {
  if (!espacio_id) {
    throw new Error("El parámetro 'espacio_id' es requerido");
  }

  try {
    let periodoConsulta = periodo_id;

    if (!periodoConsulta) {
      const periodoPorFechaQuery = `
        SELECT periodo_id, fecha_inicio, fecha_fin 
        FROM periodo 
        WHERE CURDATE() BETWEEN fecha_inicio AND fecha_fin
        ORDER BY fecha_inicio DESC 
        LIMIT 1
      `;
      
      const periodosVigentes = await AppDataSource.query(periodoPorFechaQuery);
      
      if (periodosVigentes.length === 0) {
        throw new Error("No hay períodos vigentes. Especifique un periodo_id manualmente.");
      }
      
      periodoConsulta = periodosVigentes[0].periodo_id;
    }

    const periodoExistente = await AppDataSource.query(
      `SELECT periodo_id, fecha_inicio, fecha_fin, activo FROM periodo WHERE periodo_id = ?`,
      [periodoConsulta]
    );

    if (periodoExistente.length === 0) {
      throw new Error(`El período con ID ${periodoConsulta} no existe`);
    }

    const periodoInfo = periodoExistente[0];

    const espacioExistente = await AppDataSource.query(
      `SELECT espacio_id, nombre FROM espacio WHERE espacio_id = ?`,
      [espacio_id]
    );

    if (espacioExistente.length === 0) {
      throw new Error(`El espacio con ID ${espacio_id} no existe`);
    }

    const espacioInfo = espacioExistente[0];

    const calendario = await AppDataSource.query(`
      SELECT 
        CONCAT(
            LPAD(HOUR(r.hora_inicio), 2, '0'), ':', LPAD(MINUTE(r.hora_inicio), 2, '0'), 
            ' - ', 
            LPAD(HOUR(r.hora_fin), 2, '0'), ':', LPAD(MINUTE(r.hora_fin), 2, '0')
        ) AS hora_rango,
        
        -- Lunes (día 2)
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 2 THEN 
          CONCAT(
            COALESCE(m.nombre, se.motivo), 
            ' | Grupo ', COALESCE(s.grupo, 'Especial'), 
            ' | ', COALESCE(u_norm.nombre, u_esp.nombre)
          ) 
        END) AS lunes,
        
        -- Martes (día 3)
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 3 THEN 
          CONCAT(
            COALESCE(m.nombre, se.motivo), 
            ' | Grupo ', COALESCE(s.grupo, 'Especial'), 
            ' | ', COALESCE(u_norm.nombre, u_esp.nombre)
          ) 
        END) AS martes,
        
        -- Miércoles (día 4)
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 4 THEN 
          CONCAT(
            COALESCE(m.nombre, se.motivo), 
            ' | Grupo ', COALESCE(s.grupo, 'Especial'), 
            ' | ', COALESCE(u_norm.nombre, u_esp.nombre)
          ) 
        END) AS miercoles,
        
        -- Jueves (día 5)
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 5 THEN 
          CONCAT(
            COALESCE(m.nombre, se.motivo), 
            ' | Grupo ', COALESCE(s.grupo, 'Especial'), 
            ' | ', COALESCE(u_norm.nombre, u_esp.nombre)
          ) 
        END) AS jueves,
        
        -- Viernes (día 6)
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 6 THEN 
          CONCAT(
            COALESCE(m.nombre, se.motivo), 
            ' | Grupo ', COALESCE(s.grupo, 'Especial'), 
            ' | ', COALESCE(u_norm.nombre, u_esp.nombre)
          ) 
        END) AS viernes,
        
        -- Sábado (día 7)
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 7 THEN 
          CONCAT(
            COALESCE(m.nombre, se.motivo), 
            ' | Grupo ', COALESCE(s.grupo, 'Especial'), 
            ' | ', COALESCE(u_norm.nombre, u_esp.nombre)
          ) 
        END) AS sabado,
        
        -- Domingo (día 1)
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 1 THEN 
          CONCAT(
            COALESCE(m.nombre, se.motivo), 
            ' | Grupo ', COALESCE(s.grupo, 'Especial'), 
            ' | ', COALESCE(u_norm.nombre, u_esp.nombre)
          ) 
        END) AS domingo,

        -- Información adicional para debugging
        COUNT(*) AS total_reservas

      FROM reserva r
      INNER JOIN espacio e ON e.espacio_id = r.espacio_id
      
      -- LEFT JOINs para solicitudes normales
      LEFT JOIN solicitud s ON s.solicitud_id = r.solicitud_id
      LEFT JOIN usuario u_norm ON u_norm.usuario_id = s.usuario_id
      LEFT JOIN materia m ON m.materia_id = s.materia_id
      
      -- LEFT JOINs para solicitudes especiales
      LEFT JOIN solicitud_especial se ON se.solicitud_especial_id = r.solicitud_especial_id
      LEFT JOIN usuario u_esp ON u_esp.usuario_id = se.usuario_id
      
      WHERE r.espacio_id = ? 
        AND (
          -- Incluir solicitudes normales del período
          (s.periodo_id = ? AND s.estado = 'aprobada') 
          OR 
          -- Incluir solicitudes especiales aprobadas dentro del rango del período
          (se.estado = 'aprobada' AND r.fecha BETWEEN ? AND ?)
        )
      GROUP BY hora_rango
      ORDER BY hora_rango;
    `, [espacio_id, periodoConsulta, periodoInfo.fecha_inicio, periodoInfo.fecha_fin]);

    return {
      espacio: {
        id: espacioInfo.espacio_id,
        nombre: espacioInfo.nombre
      },
      periodo: {
        id: periodoInfo.periodo_id,
        fecha_inicio: periodoInfo.fecha_inicio,
        fecha_fin: periodoInfo.fecha_fin,
        activo: periodoInfo.activo === 1,
        detectado_automaticamente: !periodo_id
      },
      calendario: calendario,
      metadatos: {
        total_franjas_horarias: calendario.length,
        fecha_consulta: new Date()
      }
    };

  } catch (error) {
    throw new Error('Error al obtener el calendario por período:'+ error.message);
  }
}


  async getSolicitudesPorSemana(mes, espacio_id = null) {
  if (!mes) throw new Error("El parámetro 'mes' es requerido");

  try {
    const anioActual = new Date().getFullYear();

    let query = `
      -- CONSULTA CORREGIDA - VERIFICACIÓN EXPLÍCITA DE ESPACIO
      SELECT 
        r.reserva_id,
        r.solicitud_id,
        r.solicitud_especial_id,
        r.fecha,
        HOUR(r.hora_inicio) AS hora,
        DAYOFWEEK(r.fecha) AS dia_semana,
        DAY(r.fecha) AS dia_mes,
        WEEK(r.fecha, 1) - WEEK(DATE_FORMAT(r.fecha, '%Y-%m-01'), 1) + 1 AS semana_del_mes,
        e.espacio_id,
        e.nombre AS espacio_nombre,
        DATE_FORMAT(r.hora_inicio, '%H:%i') AS hora_inicio,
        DATE_FORMAT(r.hora_fin, '%H:%i') AS hora_fin,
        
        -- Campos para solicitudes NORMALES
        u_norm.nombre AS usuario_normal,
        m.nombre AS materia,
        s.grupo,
        s.motivo AS motivo_normal,
        
        -- Campos para solicitudes ESPECIALES  
        u_esp.nombre AS usuario_especial,
        se.motivo AS motivo_especial,
        
        -- Determinación del tipo
        CASE 
          WHEN r.solicitud_id IS NOT NULL AND r.solicitud_id != '' THEN 'normal'
          WHEN r.solicitud_especial_id IS NOT NULL AND r.solicitud_especial_id != '' THEN 'especial'
          ELSE 'desconocido'
        END AS tipo_solicitud
        
      FROM reserva r
      INNER JOIN espacio e ON e.espacio_id = r.espacio_id
      
      -- LEFT JOINs para solicitudes normales
      LEFT JOIN solicitud s ON s.solicitud_id = r.solicitud_id
      LEFT JOIN usuario u_norm ON u_norm.usuario_id = s.usuario_id
      LEFT JOIN materia m ON m.materia_id = s.materia_id
      
      -- LEFT JOINs para solicitudes especiales
      LEFT JOIN solicitud_especial se ON se.solicitud_especial_id = r.solicitud_especial_id
      LEFT JOIN usuario u_esp ON u_esp.usuario_id = se.usuario_id
      
      WHERE MONTH(r.fecha) = ? AND YEAR(r.fecha) = ?
        AND (s.estado = 'aprobada' OR se.estado = 'aprobada')
    `;

    const params = [mes, anioActual];

    if (espacio_id) {
      query += ` AND r.espacio_id = ?`;
      params.push(espacio_id);
    }

    query += ` ORDER BY semana_del_mes, dia_semana, hora;`;

    const resultados = await AppDataSource.query(query, params);


    const tablaSemanal = {};
    let espacioNombre = 'Todos los espacios';

    resultados.forEach(row => {
      if (resultados.length > 0 && !espacioNombre.includes(row.espacio_nombre)) {
        espacioNombre = espacio_id ? row.espacio_nombre : 'Todos los espacios';
      }

      if (!tablaSemanal[row.semana_del_mes]) {
        tablaSemanal[row.semana_del_mes] = {
          semana: row.semana_del_mes.toString(),
          lunes: [],
          martes: [],
          miercoles: [],
          jueves: [],
          viernes: [],
          sabado: [],
          domingo: []
        };
      }

      const mapping = {
        2: "lunes",
        3: "martes", 
        4: "miercoles",
        5: "jueves",
        6: "viernes",
        7: "sabado",
        1: "domingo"
      };

      const dia = mapping[row.dia_semana];
      if (dia) {
        let detalle = '';
        let tipoDisplay = '';
        let icono = '';
        let usuario = '';
        let materiaMotivo = '';

        if (row.tipo_solicitud === 'normal' && row.solicitud_id) {
          usuario = row.usuario_normal;
          materiaMotivo = row.materia;
          detalle = `${row.materia} | Grupo ${row.grupo} | ${row.usuario_normal} | ${row.espacio_nombre} | ${row.hora_inicio}-${row.hora_fin}`;
          tipoDisplay = 'Clase';
        } else if (row.tipo_solicitud === 'especial' && row.solicitud_especial_id) {
          usuario = row.usuario_especial;
          materiaMotivo = row.motivo_especial;
          detalle = `${row.motivo_especial} | ${row.usuario_especial} | ${row.espacio_nombre} | ${row.hora_inicio}-${row.hora_fin}`;
          tipoDisplay = 'Evento';
        } else {
          usuario = row.usuario_normal || row.usuario_especial || 'Desconocido';
          materiaMotivo = row.motivo_normal || row.motivo_especial || 'Sin información';
          detalle = `${materiaMotivo} | ${usuario} | ${row.espacio_nombre} | ${row.hora_inicio}-${row.hora_fin}`;
          tipoDisplay = 'Indeterminado';
        }

        tablaSemanal[row.semana_del_mes][dia].push({
          diaMes: row.dia_mes,
          hora: row.hora,
          detalle,
          reserva_id: row.reserva_id,
          tipo: row.tipo_solicitud,
          tipo_display: tipoDisplay,
          icono: icono,
          hora_inicio: row.hora_inicio,
          hora_fin: row.hora_fin,
          espacio_id: row.espacio_id,
          espacio_nombre: row.espacio_nombre,
          usuario: usuario,
          materia: row.materia,
          grupo: row.grupo,
          motivo: row.motivo_especial || row.motivo_normal,
          solicitud_id: row.solicitud_id,
          solicitud_especial_id: row.solicitud_especial_id
        });
      }
    });

    const semanasOrdenadas = [];
    const maxSemana = Math.max(...Object.keys(tablaSemanal).map(Number), 0);
    
    for (let i = 1; i <= maxSemana; i++) {
      semanasOrdenadas.push(
        tablaSemanal[i] || {
          semana: i.toString(),
          lunes: [],
          martes: [],
          miercoles: [],
          jueves: [],
          viernes: [],
          sabado: [],
          domingo: []
        }
      );
    }

    return {
      mes: mes,
      anio: anioActual,
      espacio_id: espacio_id || 'todos',
      espacio_nombre: espacioNombre,
      total_reservas: resultados.length,
      semanas: semanasOrdenadas
    };
  } catch (error) {
    throw new Error('Error al obtener las solicitudes semanales: ' + error.message);
  }
}

async getSolicitudes() {
  const result = await AppDataSource.query(`
    SELECT 
      s.solicitud_id,
      u.nombre AS usuario,
      e.nombre AS espacio,
      ub.ubicacion AS ubicacion,
      m.nombre AS materia,
      pe.nombre_carrera AS plan_estudio,
      s.grupo,
      s.motivo,
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM solicitud s2 
          JOIN solicitud_horario sh2 ON sh2.solicitud_id = s2.solicitud_id
          JOIN solicitud_horario sh1 ON sh1.solicitud_id = s.solicitud_id
          WHERE s2.solicitud_id != s.solicitud_id
            AND s2.espacio_id = s.espacio_id
            AND s2.periodo_id = s.periodo_id
            AND s2.estado IN ('pendiente', 'aprobada')
            AND sh1.dia_semana = sh2.dia_semana
            AND (
              (sh1.hora_inicio < sh2.hora_fin AND sh1.hora_fin > sh2.hora_inicio) OR
              (sh2.hora_inicio < sh1.hora_fin AND sh2.hora_fin > sh1.hora_inicio)
            )
        ) THEN 'aprobada-en-conflicto'
        ELSE s.estado
      END AS estado,
      s.fecha_creacion
    FROM solicitud s
    LEFT JOIN usuario u ON u.usuario_id = s.usuario_id
    LEFT JOIN espacio e ON e.espacio_id = s.espacio_id
    LEFT JOIN ubicacion ub ON ub.ubicacion_id = e.ubicacion_id
    LEFT JOIN periodo p ON p.periodo_id = s.periodo_id
    LEFT JOIN materia m ON m.materia_id = s.materia_id
    LEFT JOIN plan_estudio pe ON pe.plan_id = m.plan_id
    WHERE s.estado = 'aprobada'
    ORDER BY 
      CASE 
        WHEN estado = 'aprobada-en-conflicto' THEN 1
        ELSE 2
      END,
      s.fecha_creacion DESC;
  `);
  return result;
}

  async getAll() {
  const result = await AppDataSource.query(`
    SELECT 
      s.solicitud_id,
      u.nombre AS usuario,
      e.nombre AS espacio,
      ub.ubicacion AS ubicacion,
      m.nombre AS materia,
      s.grupo,
      s.motivo,
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM solicitud s2 
          JOIN solicitud_horario sh2 ON sh2.solicitud_id = s2.solicitud_id
          JOIN solicitud_horario sh1 ON sh1.solicitud_id = s.solicitud_id
          WHERE s2.solicitud_id != s.solicitud_id
            AND s2.espacio_id = s.espacio_id
            AND s2.periodo_id = s.periodo_id
            AND sh1.dia_semana = sh2.dia_semana
            AND (
              (sh1.hora_inicio < sh2.hora_fin AND sh1.hora_fin > sh2.hora_inicio) OR
              (sh2.hora_inicio < sh1.hora_fin AND sh2.hora_fin > sh1.hora_inicio)
            )
        ) AND s.estado = 'pendiente' THEN 'pendiente-en-conflicto'
        ELSE s.estado
      END AS estado,
      s.fecha_creacion,
      -- Información de horarios de la solicitud actual
      (
        SELECT GROUP_CONCAT(
          CONCAT(
            CASE sh.dia_semana
              WHEN 1 THEN 'Lun'
              WHEN 2 THEN 'Mar'
              WHEN 3 THEN 'Mié'
              WHEN 4 THEN 'Jue'
              WHEN 5 THEN 'Vie'
              WHEN 6 THEN 'Sáb'
              WHEN 7 THEN 'Dom'
            END,
            ' ',
            TIME_FORMAT(sh.hora_inicio, '%H:%i'),
            '-',
            TIME_FORMAT(sh.hora_fin, '%H:%i')
          ) SEPARATOR ', '
        )
        FROM solicitud_horario sh
        WHERE sh.solicitud_id = s.solicitud_id
      ) AS horarios
    FROM solicitud s
    LEFT JOIN usuario u ON u.usuario_id = s.usuario_id
    LEFT JOIN espacio e ON e.espacio_id = s.espacio_id
    LEFT JOIN ubicacion ub ON ub.ubicacion_id = e.ubicacion_id
    LEFT JOIN periodo p ON p.periodo_id = s.periodo_id
    LEFT JOIN materia m ON m.materia_id = s.materia_id
    LEFT JOIN plan_estudio pe ON pe.plan_id = m.plan_id
    ORDER BY 
      CASE 
        WHEN estado = 'pendiente-en-conflicto' THEN 1
        WHEN estado = 'pendiente' THEN 2
        ELSE 3
      END,
      s.fecha_creacion DESC;
  `);
  return result;
}
}

module.exports = new SolicitudService();

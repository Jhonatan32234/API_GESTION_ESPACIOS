const AppDataSource = require("../config/ormconfig"); 

class SolicitudService {

async aprobarSolicitud(solicitud_id, usuario_id) {
  const result = await AppDataSource.query(
    `CALL aprobar_solicitud_normal(?, ?)`,
    [solicitud_id, usuario_id]
  );
  return result;
}

async rechazarSolicitudNormal(solicitud_id) {
    const result = await AppDataSource.query(
      `CALL rechazar_solicitud_normal(?)`,
      [solicitud_id]
    );
    return result;
  }

  async insertarSolicitudNormal(data) {
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

    return result;
  }

  async getCalendarioPorPeriodo(periodo_id) {
    if (!periodo_id) throw new Error("Debe especificar el periodo_id");

    const calendario = await AppDataSource.query(`
      SELECT 
        CONCAT(
            LPAD(HOUR(r.hora_inicio), 2, '0'), ':', LPAD(MINUTE(r.hora_inicio), 2, '0'), 
            ' - ', 
            LPAD(HOUR(r.hora_fin), 2, '0'), ':', LPAD(MINUTE(r.hora_fin), 2, '0')
        ) AS hora_rango,
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 2 THEN CONCAT(
            'Solicitud ', r.solicitud_id, 
            ' | ', m.nombre, 
            ' | Grupo ', s.grupo, 
            ' | ', u.nombre
        ) END) AS lunes,
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 3 THEN CONCAT(
            'Solicitud ', r.solicitud_id, 
            ' | ', m.nombre, 
            ' | Grupo ', s.grupo, 
            ' | ', u.nombre
        ) END) AS martes,
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 4 THEN CONCAT(
            'Solicitud ', r.solicitud_id, 
            ' | ', m.nombre, 
            ' | Grupo ', s.grupo, 
            ' | ', u.nombre
        ) END) AS miercoles,
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 5 THEN CONCAT(
            'Solicitud ', r.solicitud_id, 
            ' | ', m.nombre, 
            ' | Grupo ', s.grupo, 
            ' | ', u.nombre
        ) END) AS jueves,
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 6 THEN CONCAT(
            'Solicitud ', r.solicitud_id, 
            ' | ', m.nombre, 
            ' | Grupo ', s.grupo, 
            ' | ', u.nombre
        ) END) AS viernes,
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 7 THEN CONCAT(
            'Solicitud ', r.solicitud_id, 
            ' | ', m.nombre, 
            ' | Grupo ', s.grupo, 
            ' | ', u.nombre
        ) END) AS sabado,
        MAX(CASE WHEN DAYOFWEEK(r.fecha) = 1 THEN CONCAT(
            'Solicitud ', r.solicitud_id, 
            ' | ', m.nombre, 
            ' | Grupo ', s.grupo, 
            ' | ', u.nombre
        ) END) AS domingo
      FROM reserva r
      JOIN solicitud s ON s.solicitud_id = r.solicitud_id
      JOIN usuario u ON u.usuario_id = s.usuario_id
      JOIN materia m ON m.materia_id = s.materia_id
      WHERE s.periodo_id = ?
      GROUP BY hora_rango
      ORDER BY hora_rango;
    `, [periodo_id]);

    return calendario;
  }

async getSolicitudesPorSemana(periodo_id, mes, anio) {
  if (!periodo_id || !mes || !anio) throw new Error("Faltan parámetros");

  try {
    const semanal = await AppDataSource.query(`
      SELECT 
        r.reserva_id,
        r.solicitud_id,
        NULL AS solicitud_especial_id,
        r.fecha,
        HOUR(r.hora_inicio) AS hora,
        DAYOFWEEK(r.fecha) AS dia_semana,
        DAY(r.fecha) AS dia_mes,
        WEEK(r.fecha, 1) - WEEK(DATE_FORMAT(r.fecha, '%Y-%m-01'), 1) + 1 AS semana_del_mes,
        u.nombre AS usuario,
        m.nombre AS materia,
        s.grupo,
        e.nombre AS espacio,
        'normal' AS tipo_solicitud
      FROM reserva r
      JOIN solicitud s ON s.solicitud_id = r.solicitud_id
      JOIN usuario u ON u.usuario_id = s.usuario_id
      JOIN materia m ON m.materia_id = s.materia_id
      JOIN espacio e ON e.espacio_id = r.espacio_id
      WHERE s.periodo_id = ?
        AND MONTH(r.fecha) = ?
        AND YEAR(r.fecha) = ?

      UNION ALL

      SELECT
        r.reserva_id,
        NULL AS solicitud_id,
        r.solicitud_especial_id,
        r.fecha,
        HOUR(r.hora_inicio) AS hora,
        DAYOFWEEK(r.fecha) AS dia_semana,
        DAY(r.fecha) AS dia_mes,
        WEEK(r.fecha, 1) - WEEK(DATE_FORMAT(r.fecha, '%Y-%m-01'), 1) + 1 AS semana_del_mes,
        u.nombre AS usuario,
        NULL AS materia,
        NULL AS grupo,
        e.nombre AS espacio,
        'especial' AS tipo_solicitud
      FROM reserva r
      JOIN solicitud_especial se ON se.solicitud_especial_id = r.solicitud_especial_id
      JOIN usuario u ON u.usuario_id = se.usuario_id
      JOIN espacio e ON e.espacio_id = r.espacio_id
      WHERE MONTH(r.fecha) = ?
        AND YEAR(r.fecha) = ?

      ORDER BY semana_del_mes, dia_semana, hora;
    `, [periodo_id, mes, anio, mes, anio]);


    const tablaSemanal = {};
    semanal.forEach(row => {
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
        if (row.tipo_solicitud === 'normal') {
          detalle = `${row.materia} | Grupo ${row.grupo} | ${row.usuario} | Aula ${row.espacio} | ${String(row.hora).padStart(2, '0')}:00`;
        } else {
          detalle = `Evento especial | ${row.solicitud_especial_id} | ${row.usuario} | Aula ${row.espacio} | ${String(row.hora).padStart(2, '0')}:00`;
        }
        tablaSemanal[row.semana_del_mes][dia].push({
          diaMes: row.dia_mes,
          hora: row.hora,
          detalle
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

    return semanasOrdenadas;
  } catch (error) {
    console.error('Error en getSolicitudesPorSemana:', error);
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
  p.nombre AS periodo,
  m.nombre AS materia,
  pe.nombre_carrera AS plan_estudio,
  s.grupo,
  s.motivo,
  s.estado
FROM solicitud s
LEFT JOIN usuario u ON u.usuario_id = s.usuario_id
LEFT JOIN espacio e ON e.espacio_id = s.espacio_id
LEFT JOIN ubicacion ub ON ub.ubicacion_id = e.ubicacion_id
LEFT JOIN periodo p ON p.periodo_id = s.periodo_id
LEFT JOIN materia m ON m.materia_id = s.materia_id
LEFT JOIN plan_estudio pe ON pe.plan_id = m.plan_id
WHERE s.estado = 'aprobada'
ORDER BY s.fecha_creacion DESC;

    `);

    return result;
  }

  async getSolicitudesPendRech() {
    const result = await AppDataSource.query(`
      SELECT 
  s.solicitud_id,
  u.nombre AS usuario,
  e.nombre AS espacio,
  ub.ubicacion AS ubicacion,
  p.nombre AS periodo,
  m.nombre AS materia,
  pe.nombre_carrera AS plan_estudio,
  s.grupo,
  s.motivo,
  s.estado
FROM solicitud s
LEFT JOIN usuario u ON u.usuario_id = s.usuario_id
LEFT JOIN espacio e ON e.espacio_id = s.espacio_id
LEFT JOIN ubicacion ub ON ub.ubicacion_id = e.ubicacion_id
LEFT JOIN periodo p ON p.periodo_id = s.periodo_id
LEFT JOIN materia m ON m.materia_id = s.materia_id
LEFT JOIN plan_estudio pe ON pe.plan_id = m.plan_id
WHERE s.estado IN ('pendiente', 'rechazada')
ORDER BY s.fecha_creacion DESC;

    `);

    return result;
  }
}

module.exports = new SolicitudService();

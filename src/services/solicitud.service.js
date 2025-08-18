const AppDataSource = require("../config/ormconfig"); 
const nodemailer = require("nodemailer"); // 👈 necesitas instalarlo con npm i nodemailer


class SolicitudService {

  async insertarSolicitudNormal({
  usuario_id,
  espacio_id,
  periodo_id,
  materia_id,
  grupo,
  motivo,
  cantidad_asistentes,
  dias,
  hora_inicio,
  hora_fin
}) {
  // Llamada al procedure
  const result = await AppDataSource.query(
    `CALL insertar_solicitud_normal(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      usuario_id,
      espacio_id,
      periodo_id,
      materia_id,
      grupo,
      motivo,
      cantidad_asistentes,
      JSON.stringify(dias),
      hora_inicio,
      hora_fin
    ]
  );

  const notifications = result[0] || [];

  // Enviar correos a todos los destinatarios usando sus propios emails
  for (const notif of notifications) {
    if (notif.destinatario_email) {
      // Aquí usamos el correo que viene de la DB
      await this.enviarCorreoDirecto(
        notif.destinatario_email,
        notif.asunto || "Notificación sobre solicitud",
        notif.mensaje
      );
    }
  }

  return notifications;
}

// Método que no depende de envs, solo del correo del destinatario
async enviarCorreoDirecto(destinatario, asunto, mensaje) {
  const transporter = nodemailer.createTransport({
    host: "smtp.ids.upchiapas.edu.mx", // o smtp institucional
    port: 587,
    secure: false
    
  });

  await transporter.sendMail({
    from: `"Gestión de Espacios" <no-reply@tu-dominio.com>`, // remitente genérico
    to: destinatario, // correo del usuario o admin recibido de la DB
    subject: asunto,
    text: mensaje
  });
}


  async aprobarSolicitud(solicitud_id) {
    await AppDataSource.query(
      `CALL aprobar_solicitud(?)`,
      [solicitud_id]
    );
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
      WITH RECURSIVE horas AS (
        SELECT 0 AS n
        UNION ALL
        SELECT n + 1 FROM horas WHERE n < 23
      ),
      reservas_expandidas AS (
        SELECT 
          r.reserva_id,
          r.solicitud_id,
          r.fecha,
          HOUR(r.hora_inicio) + h.n AS hora,
          DAYOFWEEK(r.fecha) AS dia_semana,
          DAY(r.fecha) AS dia_mes,
          WEEK(r.fecha, 1) - WEEK(DATE_FORMAT(r.fecha, '%Y-%m-01'), 1) + 1 AS semana_del_mes,
          u.nombre AS usuario,
          m.nombre AS materia,
          s.grupo,
          e.nombre AS espacio
        FROM reserva r
        JOIN solicitud s ON s.solicitud_id = r.solicitud_id
        JOIN usuario u ON u.usuario_id = s.usuario_id
        JOIN materia m ON m.materia_id = s.materia_id
        JOIN espacio e ON e.espacio_id = r.espacio_id
        JOIN horas h ON HOUR(r.hora_inicio) + h.n < HOUR(r.hora_fin)
        WHERE s.periodo_id = ?
          AND MONTH(r.fecha) = ?
          AND YEAR(r.fecha) = ?
      )
      SELECT 
        semana_del_mes,
        dia_semana,
        dia_mes,
        hora,
        CONCAT(
          'Solicitud ', solicitud_id,
          ' | ', materia,
          ' | Grupo ', grupo,
          ' | ', usuario,
          ' | Aula ', espacio,
          ' | ', LPAD(hora,2,'0'), ':00'
        ) AS detalle
      FROM reservas_expandidas
      ORDER BY semana_del_mes, dia_semana, hora;
    `, [periodo_id, mes, anio]);

    // Armar tabla estructurada lunes..domingo
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
        tablaSemanal[row.semana_del_mes][dia].push({
          diaMes: row.dia_mes,
          hora: row.hora,
          detalle: row.detalle
        });
      }
    });

    // Ordenar las semanas y asegurarse de que todas existan
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
}

module.exports = new SolicitudService();

const AppDataSource = require("../config/ormconfig");

class ReporteDanoService {

  async insertarReporte(usuario_id, inventario_id, descripcion) {
    try {
      const result = await AppDataSource.query(
        `CALL insertar_reporte_dano(?, ?, ?)`,
        [usuario_id, inventario_id, descripcion]
      );
      // Retorna un objeto indicando éxito
      return { success: true, message: "Reporte insertado correctamente", data: result };
    } catch (error) {
      // Detecta el error del SIGNAL de MySQL
      if (error.code === 'ER_SIGNAL_EXCEPTION') {
        return { success: false, message: error.sqlMessage }; // mensaje amigable
      }
      // Otros errores los re-lanza
      throw error;
    }
  }

  async actualizarReporte(reporteId, data) {
  const connection = AppDataSource;
  try {
    // 1. Buscar el reporte actual
    const [reporteActual] = await connection.query(
      `SELECT * FROM reporte_dano WHERE reporte_id = ?`,
      [reporteId]
    );
    if (!reporteActual) {
      return { success: false, message: "Reporte no encontrado" };
    }

    // 2. Si se envía un nuevo inventario_id y es diferente al actual
    if (data.inventario_id && data.inventario_id !== reporteActual.inventario_id) {
      // Reactivar inventario anterior
      if (reporteActual.inventario_id) {
        await connection.query(
          `UPDATE inventario SET estado = 'operativo' WHERE inventario_id = ?`,
          [reporteActual.inventario_id]
        );
      }

      // Desactivar nuevo inventario
      await connection.query(
        `UPDATE inventario SET estado = 'desactivado' WHERE inventario_id = ?`,
        [data.inventario_id]
      );
    }

    // 3. Construir query dinámica para actualizar solo campos enviados (salvo id)
    const campos = [];
    const valores = [];
    for (const key in data) {
      if (key !== "reporte_id" && data[key] !== undefined) {
        campos.push(`${key} = ?`);
        valores.push(data[key]);
      }
    }

    if (campos.length === 0) {
      return { success: false, message: "No se enviaron campos para actualizar" };
    }

    valores.push(reporteId);
    await connection.query(
      `UPDATE reporte_dano SET ${campos.join(", ")} WHERE reporte_id = ?`,
      valores
    );

    return { success: true, message: "Reporte actualizado correctamente" };
  } catch (error) {
    throw error;
  }
}

  async getPendientesEnProceso() {
  return await AppDataSource.query(`
    SELECT r.reporte_id, r.descripcion, r.fecha_reporte, r.estado, r.inventario_id,
           u.usuario_id, u.nombre, u.apellido, u.apellido2
    FROM reporte_dano r
    JOIN usuario u ON r.usuario_id = u.usuario_id
    WHERE r.estado IN ('pendiente','en_proceso')
  `);
}

async getReparados() {
  return await AppDataSource.query(`
    SELECT r.reporte_id, r.descripcion, r.fecha_reporte, r.estado, r.inventario_id,
           u.usuario_id, u.nombre, u.apellido, u.apellido2
    FROM reporte_dano r
    JOIN usuario u ON r.usuario_id = u.usuario_id
    WHERE r.estado = 'reparado'
  `);
}

async getPorUsuario(usuario_id) {
  return await AppDataSource.query(`
    SELECT r.reporte_id, r.descripcion, r.fecha_reporte, r.estado,
           u.usuario_id, u.nombre, u.apellido, u.apellido2
    FROM reporte_dano r
    JOIN usuario u ON r.usuario_id = u.usuario_id
    WHERE r.usuario_id = ?
  `, [usuario_id]);
  }

 async rechazarReporte(reporteId) {
    const result = await AppDataSource.query(
      `CALL rechazar_reporte_danio(?)`,
      [reporteId]
    );
    return result;
  }

  

async marcarEnProceso(reporteId) {
  try {
    // Cambiar estado
    await AppDataSource.query(
      `UPDATE reporte_dano SET estado = 'en_proceso' WHERE reporte_id = ?`,
      [reporteId]
    );

    // Buscar usuario relacionado
    const [reporte] = await AppDataSource.query(
      `SELECT usuario_id FROM reporte_dano WHERE reporte_id = ?`,
      [reporteId]
    );

    if (reporte && reporte.usuario_id) {
      await AppDataSource.query(
        `INSERT INTO notificacion (usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
         VALUES (?, 'reporte', ?, ?, 'reporte_dano')`,
        [reporte.usuario_id, 'Tu reporte está siendo procesado', reporteId]
      );
    }

    return { success: true, message: "Reporte marcado como en proceso y notificado al usuario" };
  } catch (error) {
    throw error;
  }
}

async marcarReparado(reporteId) {
  try {
    // Cambiar estado
    await AppDataSource.query(
      `UPDATE reporte_dano SET estado = 'reparado' WHERE reporte_id = ?`,
      [reporteId]
    );

    // Buscar usuario relacionado
    const [reporte] = await AppDataSource.query(
      `SELECT usuario_id FROM reporte_dano WHERE reporte_id = ?`,
      [reporteId]
    );

    if (reporte && reporte.usuario_id) {
      await AppDataSource.query(
        `INSERT INTO notificacion (usuario_id, tipo, mensaje, relacion_id, relacion_tipo)
         VALUES (?, 'reporte', ?, ?, 'reporte_dano')`,
        [reporte.usuario_id, 'Tu reporte ha sido reparado con éxito', reporteId]
      );
    }

    return { success: true, message: "Reporte marcado como reparado y notificado al usuario" };
  } catch (error) {
    throw error;
  }
}
}

module.exports = new ReporteDanoService();

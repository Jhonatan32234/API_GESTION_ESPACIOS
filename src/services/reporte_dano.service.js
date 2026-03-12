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

 async getAllReportesAgrupados() {
    const rawData = await AppDataSource.query(`
        SELECT 
            ub.ubicacion_id, 
            ub.ubicacion AS nombre_ubicacion,
            e.espacio_id, 
            e.nombre AS nombre_espacio,
            r.reporte_id, 
            r.descripcion, 
            r.estado, 
            r.fecha_reporte,
            u.nombre AS usuario_nombre, 
            u.apellido AS usuario_apellido,
            ce.nombre_elemento AS item_danado
        FROM ubicacion ub
        JOIN espacio e ON ub.ubicacion_id = e.ubicacion_id
        JOIN espacio_inventario ei ON e.espacio_id = ei.espacio_id
        JOIN inventario i ON ei.inventario_id = i.inventario_id
        JOIN reporte_dano r ON i.inventario_id = r.inventario_id
        JOIN usuario u ON r.usuario_id = u.usuario_id
        JOIN catalogo_elemento ce ON i.catalogo_id = ce.catalogo_id
        ORDER BY ub.ubicacion, e.nombre, r.fecha_reporte DESC
    `);

    // Agrupación de datos en formato jerárquico
    const agrupado = rawData.reduce((acc, curr) => {
        // 1. Buscar o crear la ubicación
        let ubicacion = acc.find(u => u.id_ubicacion === curr.ubicacion_id);
        if (!ubicacion) {
            ubicacion = {
                id_ubicacion: curr.ubicacion_id,
                nombre_ubicacion: curr.nombre_ubicacion,
                espacios: []
            };
            acc.push(ubicacion);
        }

        // 2. Buscar o crear el espacio dentro de la ubicación
        let espacio = ubicacion.espacios.find(e => e.id_espacio === curr.espacio_id);
        if (!espacio) {
            espacio = {
                id_espacio: curr.espacio_id,
                nombre_espacio: curr.nombre_espacio,
                reportes: []
            };
            ubicacion.espacios.push(espacio);
        }

        // 3. Agregar el reporte al espacio
        espacio.reportes.push({
            reporte_id: curr.reporte_id,
            descripcion: curr.descripcion,
            estado: curr.estado,
            fecha: curr.fecha_reporte,
            elemento: curr.item_danado,
            reportado_por: `${curr.usuario_nombre} ${curr.usuario_apellido}`
        });

        return acc;
    }, []);

    return agrupado;
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
    SELECT 
      r.reporte_id, 
      r.descripcion, 
      r.fecha_reporte, 
      r.estado,
      u.usuario_id, 
      u.nombre, 
      u.apellido, 
      u.apellido2,
      e.espacio_id,
      e.nombre as nombre_espacio,
      ub.ubicacion_id,
      ub.ubicacion as nombre_ubicacion
    FROM reporte_dano r
    JOIN usuario u ON r.usuario_id = u.usuario_id
    LEFT JOIN inventario i ON r.inventario_id = i.inventario_id
    LEFT JOIN espacio_inventario ei ON i.inventario_id = ei.inventario_id
    LEFT JOIN espacio e ON ei.espacio_id = e.espacio_id
    LEFT JOIN ubicacion ub ON e.ubicacion_id = ub.ubicacion_id
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

const AppDataSource = require("../config/ormconfig");
const Periodo = require("../models/Periodo");

class PeriodoService {
  constructor() {
    this.repo = AppDataSource.getRepository(Periodo);
    this.meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
  }

  // Método para parsear fecha YYYY-MM-DD sin problemas de zona horaria
  _parsearFechaISO(fechaStr) {
    if (!fechaStr) return null;
    
    // Método 1: Directamente de la cadena ISO
    const [anio, mes, dia] = fechaStr.split('-').map(Number);
    
    // Crear fecha en hora local (sin problemas de UTC)
    // Restamos 1 al mes porque JavaScript usa 0-11
    return new Date(anio, mes - 1, dia);
  }

  // Método para formatear el nombre del periodo - VERSIÓN CORREGIDA
  _formatearNombrePeriodo(fechaInicio, fechaFin) {
    try {
      // Validar entradas
      if (!fechaInicio || !fechaFin) {
        return "Fecha no válida";
      }

      // Parsear fechas sin problemas de zona horaria
      const inicio = this._parsearFechaISO(fechaInicio);
      const fin = this._parsearFechaISO(fechaFin);
      
      // Validar que las fechas sean válidas
      if (!inicio || !fin || isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return "Fecha no válida";
      }

      // Obtener meses (0-11)
      const mesInicioIndex = inicio.getMonth();
      const mesFinIndex = fin.getMonth();
      
      // Obtener años
      const anioInicio = inicio.getFullYear();
      const anioFin = fin.getFullYear();
      
      // Obtener nombres de meses
      const mesInicio = this.meses[mesInicioIndex];
      const mesFin = this.meses[mesFinIndex];
      
      // Si los años son diferentes, incluir ambos años
      if (anioInicio !== anioFin) {
        return `${mesInicio} ${anioInicio} - ${mesFin} ${anioFin}`;
      }
      
      return `${mesInicio}-${mesFin}`;
      
    } catch (error) {
      console.error("Error formateando nombre de periodo:", error);
      return "Error al formatear periodo";
    }
  }

  // Método alternativo - SOLUCIÓN SIMPLE Y DIRECTA
  _formatearNombrePeriodoSimple(fechaInicio, fechaFin) {
    try {
      // Mapeo directo de meses
      const mesesMap = {
        '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
        '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
        '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
      };
      
      // Extraer mes directamente del string YYYY-MM-DD
      const mesInicioNum = fechaInicio.substring(5, 7); // "01" para Enero
      const mesFinNum = fechaFin.substring(5, 7);       // "04" para Abril
      
      // Extraer años
      const anioInicio = fechaInicio.substring(0, 4);
      const anioFin = fechaFin.substring(0, 4);
      
      const mesInicio = mesesMap[mesInicioNum] || `Mes ${mesInicioNum}`;
      const mesFin = mesesMap[mesFinNum] || `Mes ${mesFinNum}`;
      
      // Si los años son diferentes, incluir ambos años
      if (anioInicio !== anioFin) {
        return `${mesInicio} ${anioInicio} - ${mesFin} ${anioFin}`;
      }
      
      return `${mesInicio}-${mesFin}`;
      
    } catch (error) {
      console.error("Error formateando nombre de periodo:", error);
      return "Error al formatear periodo";
    }
  }

  // Método para obtener el año CORREGIDO
  _obtenerAnio(fechaStr) {
    try {
      if (!fechaStr) return null;
      
      // Extraer año directamente del string YYYY-MM-DD
      const anio = parseInt(fechaStr.substring(0, 4));
      return isNaN(anio) ? null : anio;
    } catch (error) {
      console.error("Error obteniendo año:", error);
      return null;
    }
  }

  // Método para calcular duración en días CORREGIDO
  _calcularDuracionDias(fechaInicio, fechaFin) {
    try {
      if (!fechaInicio || !fechaFin) return null;
      
      // Parsear fechas sin problemas de zona horaria
      const inicio = this._parsearFechaISO(fechaInicio);
      const fin = this._parsearFechaISO(fechaFin);
      
      if (!inicio || !fin || isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return null;
      }
      
      // Calcular diferencia en milisegundos
      const diferenciaMs = fin.getTime() - inicio.getTime();
      
      // Convertir a días (redondear hacia arriba)
      const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
      
      // Añadir 1 porque la fecha de fin está incluida
      return dias + 1;
      
    } catch (error) {
      console.error("Error calculando duración:", error);
      return null;
    }
  }

  // Método para enriquecer el periodo CORREGIDO
  _enriquecerPeriodo(periodo) {
    if (!periodo) return periodo;
    
    const periodoEnriquecido = { ...periodo };
    
    // Usar el método simple que no tiene problemas de zona horaria
    periodoEnriquecido.periodo_nombre = this._formatearNombrePeriodoSimple(
      periodo.fecha_inicio, 
      periodo.fecha_fin
    );
    
   
    
    return periodoEnriquecido;
  }

  _agregarNombrePeriodo(periodos) {
    if (Array.isArray(periodos)) {
      return periodos.map(periodo => this._enriquecerPeriodo(periodo));
    } else if (periodos) {
      return this._enriquecerPeriodo(periodos);
    }
    return periodos;
  }


  async getAll() {
    try {
      const periodos = await this.repo.find({ 
        order: { fecha_inicio: 'DESC' }
      });
      
      return this._agregarNombrePeriodo(periodos);
    } catch (error) {
      throw new Error(`Error al obtener periodos: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      const periodo = await this.repo.findOne({ 
        where: { periodo_id: id } 
      });
      
      return this._agregarNombrePeriodo(periodo);
    } catch (error) {
      throw new Error(`Error al obtener periodo: ${error.message}`);
    }
  }

  async create(data) {
    const { fecha_inicio, fecha_fin } = data;
    
    // Validaciones básicas
    if (!fecha_inicio || !fecha_fin) {
      return { success: false, message: "Las fechas de inicio y fin son requeridas" };
    }
    
    if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
      return { success: false, message: "La fecha de inicio debe ser anterior a la fecha de fin" };
    }

    try {
      // Validar que no exista un periodo con las mismas fechas
      const periodoExistente = await this.repo.findOne({
        where: {
          fecha_inicio: fecha_inicio,
          fecha_fin: fecha_fin,
          activo: true
        }
      });

      if (periodoExistente) {
        return { success: false, message: "Ya existe un periodo con las mismas fechas" };
      }

      // Validar solapamiento de fechas usando QueryBuilder
      const periodoSolapado = await this.repo
        .createQueryBuilder('periodo')
        .where('periodo.activo = :activo', { activo: true })
        .andWhere(new Date(fecha_fin).toISOString().split('T')[0] + ' BETWEEN periodo.fecha_inicio AND periodo.fecha_fin')
        .orWhere(new Date(fecha_inicio).toISOString().split('T')[0] + ' BETWEEN periodo.fecha_inicio AND periodo.fecha_fin')
        .orWhere('periodo.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin', {
          fecha_inicio: fecha_inicio,
          fecha_fin: fecha_fin
        })
        .orWhere('periodo.fecha_fin BETWEEN :fecha_inicio AND :fecha_fin', {
          fecha_inicio: fecha_inicio,
          fecha_fin: fecha_fin
        })
        .getOne();

      if (periodoSolapado) {
        return { success: false, message: "Las fechas se solapan con otro periodo activo" };
      }

      // Verificar si ya hay periodos activos
      const periodosActivos = await this.repo.find({
        where: { activo: true }
      });

      let activo = true;
      let mensaje = "Nuevo periodo creado";

      // Si ya hay un periodo activo, crear este como inactivo
      if (periodosActivos.length >= 1) {
        activo = false;
        mensaje = "Nuevo periodo creado como inactivo (ya existe un periodo activo)";
      }

      // Crear y guardar el nuevo periodo
      const nuevoPeriodo = this.repo.create({
        fecha_inicio,
        fecha_fin,
        activo
      });

      const periodoGuardado = await this.repo.save(nuevoPeriodo);
      const periodoConNombre = this._agregarNombrePeriodo(periodoGuardado);

      return {
        success: true,
        message: mensaje,
        periodo_id: periodoGuardado.periodo_id,
        periodo: periodoConNombre
      };

    } catch (error) {
      throw new Error(`Error al crear periodo: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const actual = await this.getById(id);
      if (!actual) {
        return { success: false, message: "Periodo no encontrado o inactivo" };
      }

      const { fecha_inicio, fecha_fin } = data;
      const nuevaFechaInicio = fecha_inicio || actual.fecha_inicio;
      const nuevaFechaFin = fecha_fin || actual.fecha_fin;

      // Validar que fecha_inicio sea menor que fecha_fin
      if (new Date(nuevaFechaInicio) >= new Date(nuevaFechaFin)) {
        return { success: false, message: "La fecha de inicio debe ser anterior a la fecha de fin" };
      }

      // Validar que no exista otro periodo con las mismas fechas (excluyendo el actual)
      const periodoExistente = await this.repo.findOne({
        where: {
          fecha_inicio: nuevaFechaInicio,
          fecha_fin: nuevaFechaFin,
          activo: true
        }
      });

      if (periodoExistente && periodoExistente.periodo_id !== parseInt(id)) {
        return { success: false, message: "Ya existe otro periodo con las mismas fechas" };
      }

      // Validar solapamiento con otros periodos (excluyendo el actual)
      const periodoSolapado = await this.repo
        .createQueryBuilder('periodo')
        .where('periodo.activo = :activo', { activo: true })
        .andWhere('periodo.periodo_id != :id', { id })
        .andWhere(new Date(nuevaFechaFin).toISOString().split('T')[0] + ' BETWEEN periodo.fecha_inicio AND periodo.fecha_fin')
        .orWhere(new Date(nuevaFechaInicio).toISOString().split('T')[0] + ' BETWEEN periodo.fecha_inicio AND periodo.fecha_fin')
        .orWhere('periodo.fecha_inicio BETWEEN :fecha_inicio AND :fecha_fin', {
          fecha_inicio: nuevaFechaInicio,
          fecha_fin: nuevaFechaFin
        })
        .orWhere('periodo.fecha_fin BETWEEN :fecha_inicio AND :fecha_fin', {
          fecha_inicio: nuevaFechaInicio,
          fecha_fin: nuevaFechaFin
        })
        .getOne();

      if (periodoSolapado) {
        return { success: false, message: "Las fechas se solapan con otro periodo activo" };
      }

      // Actualizar el periodo
      await this.repo.update(id, {
        fecha_inicio: nuevaFechaInicio,
        fecha_fin: nuevaFechaFin
      });

      const periodoActualizado = await this.getById(id);
      
      return {
        success: true,
        message: "Periodo actualizado correctamente",
        periodo: periodoActualizado
      };

    } catch (error) {
      throw new Error(`Error al actualizar periodo: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      // Primero, verificar si el periodo existe
      const periodo = await this.repo.findOne({ 
        where: { periodo_id: id } 
      });

      if (!periodo) {
        return { 
          success: false, 
          message: "Periodo no encontrado" 
        };
      }

      // Verificar si el periodo está activo
      const esActivo = periodo.activo;
      
      // Eliminar físicamente el periodo
      const resultado = await this.repo.delete(id);
      
      if (resultado.affected === 0) {
        return { 
          success: false, 
          message: "No se pudo eliminar el periodo" 
        };
      }

      return { 
        success: true, 
        message: `Periodo ${esActivo ? 'activo' : 'inactivo'} eliminado permanentemente` 
      };

    } catch (error) {
      // Manejar errores de restricciones de clave foránea
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || 
          error.code === '23503' || 
          error.message.includes('foreign key constraint')) {
        throw new Error(
          `No se puede eliminar el periodo porque está siendo utilizado en otras tablas. ` +
          `Primero debe eliminar o modificar los registros relacionados.`
        );
      }
      
      throw new Error(`Error al eliminar periodo: ${error.message}`);
    }
  }

  // Método para ACTIVAR un periodo (desactivando los demás)
  async activarPeriodo(id) {
    try {
      const periodo = await this.repo.findOne({
        where: { periodo_id: id }
      });

      if (!periodo) {
        return { success: false, message: "Periodo no encontrado" };
      }

      // Verificar si ya está activo
      if (periodo.activo) {
        const periodoConNombre = this._agregarNombrePeriodo(periodo);
        return { 
          success: true, 
          message: "El periodo ya está activo",
          periodo: periodoConNombre
        };
      }

      // Verificar si ya existe otro periodo activo
      const periodoActivoExistente = await this.repo.findOne({
        where: { activo: true }
      });

      if (periodoActivoExistente) {
        return { 
          success: false, 
          message: `Ya existe un periodo activo. Primero desactívelo.` 
        };
      }

      // Usar transaction para asegurar consistencia
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Activar el periodo específico
        await queryRunner.manager.update(Periodo, 
          { periodo_id: id }, 
          { activo: true }
        );

        await queryRunner.commitTransaction();

        const periodoActivado = await this.repo.findOne({
          where: { periodo_id: id }
        });
        
        const periodoConNombre = this._agregarNombrePeriodo(periodoActivado);

        return { 
          success: true, 
          message: "Periodo activado correctamente",
          periodo: periodoConNombre
        };

      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }

    } catch (error) {
      throw new Error(`Error al activar periodo: ${error.message}`);
    }
  }

  // Método para DESACTIVAR un periodo
  async desactivarPeriodo(id) {
    try {
      const periodo = await this.repo.findOne({
        where: { periodo_id: id }
      });

      if (!periodo) {
        return { success: false, message: "Periodo no encontrado" };
      }

      // Verificar si ya está inactivo
      if (!periodo.activo) {
        const periodoConNombre = this._agregarNombrePeriodo(periodo);
        return { 
          success: true, 
          message: "El periodo ya está inactivo",
          periodo: periodoConNombre
        };
      }

      // Desactivar el periodo
      await this.repo.update(id, { activo: false });
      
      const periodoDesactivado = await this.repo.findOne({
        where: { periodo_id: id }
      });
      
      const periodoConNombre = this._agregarNombrePeriodo(periodoDesactivado);

      return { 
        success: true, 
        message: "Periodo desactivado correctamente",
        periodo: periodoConNombre
      };

    } catch (error) {
      throw new Error(`Error al desactivar periodo: ${error.message}`);
    }
  }

  // Método para obtener el periodo activo
  async getPeriodoActivo() {
    try {
      const periodo = await this.repo.findOne({
        where: { activo: true }
      });
      
      return this._agregarNombrePeriodo(periodo);
    } catch (error) {
      throw new Error(`Error al obtener periodo activo: ${error.message}`);
    }
  }

  // Método para obtener TODOS los periodos (incluyendo inactivos) con nombre
  async getAllPeriodos() {
    try {
      const periodos = await this.repo.find({ 
        order: { fecha_inicio: 'DESC' }
      });
      
      return this._agregarNombrePeriodo(periodos);
    } catch (error) {
      throw new Error(`Error al obtener todos los periodos: ${error.message}`);
    }
  }
}

module.exports = new PeriodoService();
const bcrypt = require("bcryptjs");
const AppDataSource = require("../config/ormconfig");
const Usuario = require("../models/Usuario");

class UsuarioService {
  constructor() {
    this.repo = AppDataSource.getRepository(Usuario);
  }

  // Establecer que puedes mostrar de los usuarios
  async getAll() {
    return await this.repo.find({
      select: ["usuario_id", "nombre", "apellido", "apellido2", "email", "rol", "fecha_creacion", "activo"]
    });
  }

  async activar(id) {
    try {
      const usuario = await this.repo.findOne({
        where: { usuario_id: id }
      });

      if (!usuario) {
        return { success: false, message: "Usuario no encontrado" };
      }

      if (usuario.activo === true) {
        return { success: false, message: "El usuario ya se encuentra activo" };
      }

      await this.repo.update(id, { activo: true });

      return {
        success: true,
        message: "Usuario activado correctamente"
      };
    } catch (error) {
      throw new Error(`Error al activar usuario: ${error.message}`);
    }
  }

  async desactivar(idParaDesactivar, idDelAdministradorQueEjecuta) {
  try {
    // 1. Evitar que el admin se desactive a sí mismo
    if (String(idParaDesactivar) === String(idDelAdministradorQueEjecuta)) {
      return { success: false, message: "No puedes desactivar tu propia cuenta. Solicítalo a otro administrador." };
    }

    const usuario = await this.repo.findOne({ where: { usuario_id: idParaDesactivar } });

    if (!usuario) {
      return { success: false, message: "Usuario no encontrado" };
    }

    // 2. Si el usuario es admin, verificar que no sea el último activo en el sistema
    if (usuario.rol === 'administrador' && usuario.activo === true) {
      const totalAdminsActivos = await this.repo.count({
        where: { rol: 'administrador', activo: true }
      });

      if (totalAdminsActivos <= 1) {
        return { success: false, message: "Operación denegada: Debe existir al menos un administrador activo en el sistema." };
      }
    }

    // 3. Proceder con la desactivación
    await this.repo.update(idParaDesactivar, { activo: false });

    return { success: true, message: "Usuario desactivado correctamente" };
  } catch (error) {
    throw new Error(`Error al desactivar usuario: ${error.message}`);
  }
}

  async getById(id) {
    return await this.repo.findOneBy({ usuario_id: id });
  }

  async create(data) {
  // Verificar si el email ya existe
  const usuarioExistente = await this.repo.findOne({
    where: { email: data.email }
  });

  if (usuarioExistente) {
    throw new Error('El email ya está registrado');
  }

  const hash = await bcrypt.hash(data.contrasena, 10);
  const nuevo = this.repo.create({ ...data, contrasena: hash });
  
  const usuarioGuardado = await this.repo.save(nuevo);
  
  // Eliminar la contraseña del objeto de respuesta
  const usuarioResponse = { ...usuarioGuardado };
  delete usuarioResponse.contrasena;
  
  return usuarioResponse;
}

  async createFirstAdmin(data) {
    // 1. Consultar si ya existe algún usuario con el rol de administrador
    const adminExistente = await this.repo.findOne({
      where: { rol: 'administrador' }
    });

    if (adminExistente) {
      throw new Error('Ya existe un usuario administrador en el sistema. Esta funcionalidad solo está disponible para la configuración inicial.');
    }

    // 2. Verificar si el email ya existe
    const emailExistente = await this.repo.findOne({
      where: { email: data.email }
    });

    if (emailExistente) {
      throw new Error('El email ya está registrado');
    }

    // 3. Crear el usuario forzando el rol de administrador y estado activo
    const hash = await bcrypt.hash(data.contrasena, 10);
    const nuevo = this.repo.create({ 
      ...data, 
      contrasena: hash, 
      rol: 'administrador',
      activo: true 
    });
    
    const usuarioGuardado = await this.repo.save(nuevo);
    const usuarioResponse = { ...usuarioGuardado };
    delete usuarioResponse.contrasena;
    
    return usuarioResponse;
  }

  async update(id, data, solicitorId) {
    // 4. Evitar desactivarse a sí mismo mediante el update general
    if (data.activo === false && parseInt(id) === parseInt(solicitorId)) {
       throw new Error("No puedes desactivarte a ti mismo a través de la actualización de perfil");
    }

    if (data.contrasena) {
      data.contrasena = await bcrypt.hash(data.contrasena, 10);
    }
    
    await this.repo.update(id, data);
    return await this.getById(id);
  }

  async delete(id) {
    return await this.repo.delete(id);
  }

  async login(email, contrasena) {
    const usuario = await this.repo.findOne({
      where: { email },
      // Importante: incluimos 'activo' en el select para validarlo
      select: ["usuario_id", "nombre", "apellido", "apellido2", "rol", "contrasena", "activo"]
    });

    if (!usuario) return null;

    // 3. Validar si el usuario está activo antes de comparar la contraseña
    if (!usuario.activo) {
        throw new Error("Tu cuenta está desactivada. Contacta al administrador.");
    }

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) return null;

    return {
      usuario_id: usuario.usuario_id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol
    };
  }

}

module.exports = new UsuarioService();

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

  async desactivar(id) {
    try {
      const usuario = await this.repo.findOne({
        where: { usuario_id: id }
      });

      if (!usuario) {
        return { success: false, message: "Usuario no encontrado" };
      }

      if (usuario.activo === false) {
        return { success: false, message: "El usuario ya se encuentra inactivo" };
      }

      await this.repo.update(id, { activo: false });

      return {
        success: true,
        message: "Usuario desactivado correctamente"
      };
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

  async update(id, data) {
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
    select: ["usuario_id", "nombre", "apellido", "apellido2", "rol", "contrasena"] // incluir contrasena para comparar
  });

  if (!usuario) return null;

  const match = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!match) return null;

  // Devolvemos solo lo necesario
  return {
    usuario_id: usuario.usuario_id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    apellido2: usuario.apellido2,
    rol: usuario.rol
  };
}

}

module.exports = new UsuarioService();

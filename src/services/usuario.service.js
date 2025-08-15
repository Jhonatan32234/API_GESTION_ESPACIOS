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

  async getById(id) {
    return await this.repo.findOneBy({ usuario_id: id });
  }

  async create(data) {
    const hash = await bcrypt.hash(data.contrasena, 10);
    const nuevo = this.repo.create({ ...data, contrasena: hash });
    return await this.repo.save(nuevo);
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
    const usuario = await this.repo.findOneBy({ email });
    if (!usuario) return null;

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    return match ? usuario : null;
  }
}

module.exports = new UsuarioService();

const reservaService = require("../services/reserva.service");

class ReservaController {
  async eliminarReserva(req, res) {
    try {
      const { fecha, hora_inicio, hora_fin } = req.body;
      await reservaService.eliminarReservasPorFechaHora(fecha, hora_inicio, hora_fin);
      res.json({ mensaje: "Reservas eliminadas correctamente." });
    } catch (error) {
      res.status(500).json({ mensaje: "Error al eliminar reservas.", error: error.message });
    }
  }
}

module.exports = new ReservaController();

const nodemailer = require("nodemailer");

const user_email = process.env.USER_EMAIL || "";
const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || "";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: user_email,
        clientId,
        clientSecret,
        refreshToken,
      },
    });
  }

  /**
   * Envia un correo genérico
   * @param {string} destinatario
   * @param {string} asunto
   * @param {string} mensaje
   */
  async enviarCorreo(destinatario, asunto, mensaje) {
    try {
      await this.transporter.sendMail({
        from: `"Gestión de Espacios" <${user_email}>`,
        to: destinatario,
        subject: asunto,
        text: mensaje
      });
      console.log(`Correo enviado a ${destinatario}`);
    } catch (error) {
      console.error(`Error enviando correo a ${destinatario}:`, error);
    }
  }

  /**
   * Notificación de conflicto
   * @param {string} email
   * @param {number} solicitudConflictoId
   * @param {string} espacio
   * @param {string} fecha
   * @param {string} horaInicio
   * @param {string} horaFin
   */
  async notificarConflicto(email, solicitudConflictoId, espacio, fecha, horaInicio, horaFin) {
    const asunto = "Conflicto detectado en tu solicitud";
    const mensaje = `Se ha detectado un conflicto con tu solicitud ID ${solicitudConflictoId} en el espacio "${espacio}" el día ${fecha} de ${horaInicio} a ${horaFin}.`;
    await this.enviarCorreo(email, asunto, mensaje);
  }

  /**
   * Notificación de aprobación
   * @param {string} email
   * @param {number} solicitudId
   */
  async notificarAprobacion(email, solicitudId) {
    const asunto = "Solicitud aprobada";
    const mensaje = `Tu solicitud con ID ${solicitudId} ha sido aprobada.`;
    await this.enviarCorreo(email, asunto, mensaje);
  }
}

module.exports = new EmailService();

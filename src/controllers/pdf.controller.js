const pdfService = require('../services/pdf.service');
const path = require('path');
const fs = require('fs');


class PDFController {
    
    generarComprobanteReserva = async (req, res) => {
        try {
            const { reservaId } = req.params;
            
            console.log('📋 Generando comprobante de reserva:', reservaId);
            
            const datosReserva = await this.obtenerDatosReserva(reservaId);
            
            const pdfBuffer = await pdfService.generatePDF('reserva', datosReserva, {
                format: 'A4',
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });

            console.log('✅ Comprobante generado. Tamaño:', pdfBuffer.length, 'bytes');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="reserva-${reservaId}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            
            res.end(pdfBuffer);

        } catch (error) {
            console.error('❌ Error generando comprobante:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando el comprobante',
                message: error.message
            });
        }
    }

     generarReporteUsuario = async (req, res) => {
        try {
            const { usuarioId } = req.params;
            
            console.log('👤 Generando reporte de usuario:', usuarioId);
            
            const datosUsuario = await this.obtenerDatosUsuario(usuarioId);
        
            // ✅ CONVERTIR IMÁGENES A BASE64
            datosUsuario.logoBase64 = await this.imageToBase64(path.join(__dirname, '../utils/images/logo.jpg'));
            datosUsuario.fotoBase64 = await this.imageToBase64(path.join(__dirname, '../utils/images/F1.jpeg'));
            
            // ✅ AGREGAR TIMESTAMP PARA QR CODE
            datosUsuario.timestamp = Date.now();

            const pdfBuffer = await pdfService.generatePDF('reporte-usuario', datosUsuario, {
                format: 'A4',
                margin: {
                    top: '20mm',
                    right: '15mm',
                    bottom: '20mm',
                    left: '15mm'
                }
            });

            console.log('✅ Reporte de usuario generado. Tamaño:', pdfBuffer.length, 'bytes');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="reporte-usuario-${usuarioId}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            
            res.end(pdfBuffer);

        } catch (error) {
            console.error('❌ Error generando reporte de usuario:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando el reporte',
                message: error.message
            });
        }
    }


    imageToBase64 = (imagePath) => {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(imagePath)) {
                    console.warn('⚠️  Imagen no encontrada:', imagePath);
                    resolve(null);
                    return;
                }
                
                const imageBuffer = fs.readFileSync(imagePath);
                const base64 = imageBuffer.toString('base64');
                
                // Determinar el tipo MIME basado en la extensión del archivo
                const ext = path.extname(imagePath).toLowerCase();
                let mimeType = 'image/jpeg'; // Por defecto
                
                if (ext === '.png') mimeType = 'image/png';
                else if (ext === '.gif') mimeType = 'image/gif';
                else if (ext === '.svg') mimeType = 'image/svg+xml';
                
                const dataUrl = `data:${mimeType};base64,${base64}`;
                console.log('✅ Imagen convertida a Base64:', path.basename(imagePath));
                resolve(dataUrl);
                
            } catch (error) {
                console.error('❌ Error convirtiendo imagen a Base64:', error.message);
                resolve(null);
            }
        });
    }

    generarPDFPersonalizado = async (req, res) => {
        try {
            const { template, data, filename = "documento.pdf", download = false } = req.body;
            
            if (!template) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre de la plantilla es requerido'
                });
            }

            console.log('🎨 Generando PDF personalizado con plantilla:', template);

            const pdfBuffer = await pdfService.generatePDF(template, data || {});

            console.log('✅ PDF personalizado generado. Tamaño:', pdfBuffer.length, 'bytes');

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdfBuffer.length);
            
            if (download) {
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            } else {
                res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
            }
            
            res.end(pdfBuffer);

        } catch (error) {
            console.error('❌ Error generando PDF personalizado:', error);
            res.status(500).json({
                success: false,
                error: 'Error generando el PDF',
                message: error.message
            });
        }
    }

    // Métodos auxiliares para datos de ejemplo
    obtenerDatosReserva = async (reservaId) => {
        return {
            reserva: {
                id: reservaId,
                fechaReserva: new Date('2024-12-15'),
                horaInicio: '09:00',
                horaFin: '11:00',
                duracion: '2',
                estado: 'confirmada',
                descripcion: 'Reunión de planificación del proyecto de desarrollo software con el equipo completo.',
                codigoQR: `RES-${reservaId}-2024`
            },
            espacio: {
                nombre: 'Sala de Conferencias A',
                ubicacion: 'Edificio Principal - Piso 3',
                capacidad: 20,
                tipo: 'Sala de Reuniones'
            },
            usuario: {
                nombre: 'Juan',
                apellido: 'Pérez',
                apellido2: 'Gómez',
                email: 'juan.perez@empresa.com',
                rol: 'docente',
                departamento: 'Tecnologías de la Información'
            },
            equipamiento: [
                {
                    nombre: 'Proyector',
                    cantidad: 1,
                    estado: 'confirmado',
                    observaciones: 'HDMI y VGA disponibles'
                },
                {
                    nombre: 'Pizarra Digital',
                    cantidad: 1,
                    estado: 'confirmado',
                    observaciones: 'Con marcadores nuevos'
                },
                {
                    nombre: 'Sistema de Audio',
                    cantidad: 1,
                    estado: 'pendiente',
                    observaciones: 'Por confirmar disponibilidad'
                }
            ],
            fechaEmision: new Date()
        };
    }

    obtenerDatosUsuario = async (usuarioId) => {
        return {
            usuario_id: usuarioId,
            nombre: 'María',
            apellido: 'García',
            apellido2: 'López',
            email: 'maria.garcia@empresa.com',
            rol: 'docente',
            activo: true,
            fecha_creacion: new Date('2024-01-15'),
            fechaReporte: new Date(),
            timestamp: Date.now(),
            estadisticas: {
                totalReservas: 15,
                reservasActivas: 3,
                horasTotales: 45,
                ultimaReserva: new Date('2024-11-20')
            },
            historial: [
                { fecha: new Date('2024-11-20'), espacio: 'Sala de Conferencias A', estado: 'confirmada' },
                { fecha: new Date('2024-11-15'), espacio: 'Laboratorio B', estado: 'completada' },
                { fecha: new Date('2024-11-10'), espacio: 'Auditorio Principal', estado: 'completada' }
            ]
        };
    }
}

module.exports = new PDFController();
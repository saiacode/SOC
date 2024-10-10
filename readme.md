# SOC (Software de Onboarding y Clasificación)

## Descripción
SOC es un sistema inteligente diseñado para ordenar las habilidades y tareas de los socios de SAIA, utilizando IA para mejorar las consultas, mantener el flujo de conversación y proponer acciones.

## Autor
Desarrollado por César Briatore para SAIA (Sociedad Argentina de Inteligencia Artificial)

## Licencia
Este proyecto está licenciado bajo la Licencia MIT. Los derechos de autor pertenecen a SAIA. Ver el archivo [LICENSE](LICENSE) para más detalles.

## Requisitos Previos

- Node.js (v14 o superior)
- npm (normalmente viene con Node.js)
- Una cuenta de Google Cloud Platform con la API de Google Sheets habilitada
- Una cuenta de WhatsApp para el bot

## Instalación

1. Clona el repositorio:
   ```
   git clone https://github.com/tu-usuario/soc-project.git
   cd soc-project
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

## Configuración

### Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto:
   ```
   touch .env
   ```

2. Abre el archivo `.env` y añade las siguientes variables:
   ```
   GOOGLE_SHEET_ID=tu_id_de_hoja_de_calculo_aquí
   PORT=3001
   NODE_ENV=development
   ```

   Reemplaza `tu_id_de_hoja_de_calculo_aquí` con el ID real de tu hoja de Google Sheets.

### Credenciales de Google

1. Ve a la [Consola de Google Cloud](https://console.cloud.google.com/).
2. Crea un nuevo proyecto o selecciona uno existente.
3. Habilita la API de Google Sheets para tu proyecto.
4. Crea una cuenta de servicio y descarga el archivo JSON de credenciales.
5. Renombra el archivo de credenciales a `credentials.json` y colócalo en la raíz del proyecto.

### Configuración de WhatsApp

1. Asegúrate de tener una cuenta de WhatsApp disponible para el bot.
2. La primera vez que ejecutes la aplicación, necesitarás escanear un código QR para autenticar la sesión de WhatsApp.

## Ejecución

Para iniciar la aplicación, ejecuta:

```
npm start
```


La primera vez que ejecutes la aplicación, se te pedirá que escanees un código QR con tu aplicación de WhatsApp para autenticar la sesión.

## Uso

Una vez que la aplicación esté en funcionamiento:

1. Accede a la interfaz web visitando `http://localhost:3001` (o el puerto que hayas configurado).
2. Utiliza la interfaz web para monitorear el estado de la aplicación y ver el código QR de WhatsApp si es necesario.
3. Interactúa con el bot a través de WhatsApp enviando mensajes al número asociado.

## Solución de Problemas

- Si tienes problemas con las credenciales de Google, asegúrate de que el archivo `credentials.json` esté correctamente formateado y contenga las credenciales correctas.
- Si el bot de WhatsApp no responde, verifica que la sesión esté autenticada correctamente escaneando el código QR nuevamente.
- Para problemas de conexión con la hoja de cálculo, verifica que el ID de la hoja en el archivo `.env` sea correcto y que la cuenta de servicio tenga los permisos necesarios.

## Contribuir

Si deseas contribuir al proyecto, por favor:

1. Haz un fork del repositorio
2. Crea una nueva rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
# language: es
Característica: Procesamiento Batch DLQ

  Esquema del escenario: handleNotificationFailed marca la notificación como FAILED_PERMANENT y persiste el evento outbox
    Dado un registro DLQ de notificación con notificationId "<notificationId>" y callbackUrl "https://example.com/callback"
    Cuando el servicio de batch DLQ maneja el fallo de notificación
    Entonces se realiza la escritura atómica de estado FAILED_PERMANENT y evento outbox WEBHOOK_REQUESTED

    Ejemplos:
      | notificationId |
      | NOTIF-001      |
      | NOTIF-999      |

  Escenario: El caso de uso completa cuando todos los registros son actualizados
    Dado un batch DLQ de 2 registros NOTIFICATION_FAILED donde todas las actualizaciones tienen éxito
    Cuando el caso de uso de marcar batch fallido permanente se ejecuta
    Entonces no se lanza ninguna excepción

  Escenario: El caso de uso marca el registro como reintentable cuando ocurre un error de infraestructura
    Dado un batch DLQ de 2 registros NOTIFICATION_FAILED donde uno causa un error de infraestructura
    Cuando el caso de uso de marcar batch fallido permanente se ejecuta
    Entonces el resultado contiene 1 registro reintentable

  Escenario: handle WEBHOOK_FAILED actualiza webhookStatus a FAILED sin modificar el estado de la notificación
    Dado un mensaje WEBHOOK_FAILED con notificationId "NOTIF-001"
    Cuando el servicio de batch DLQ maneja el fallo de webhook
    Entonces el webhookStatus es actualizado a FAILED
    Y el estado de la notificación no es modificado

  Escenario: El caso de uso descarta sin error registros con messageType desconocido
    Dado un batch DLQ de 1 registro con messageType desconocido
    Cuando el caso de uso de marcar batch fallido permanente se ejecuta
    Entonces el servicio de dominio no es invocado

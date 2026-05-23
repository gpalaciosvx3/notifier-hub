# language: es
Característica: Procesamiento Batch DLQ

  Esquema del escenario: markFailed marca el registro como fallido permanente y retorna true
    Dado un registro DLQ con notificationId "<notificationId>"
    Cuando el servicio de batch DLQ marca el registro como fallido
    Entonces el resultado es true

    Ejemplos:
      | notificationId |
      | NOTIF-001      |
      | NOTIF-999      |

  Escenario: El caso de uso completa cuando todos los registros son actualizados
    Dado un batch DLQ de 2 registros donde todas las actualizaciones tienen éxito
    Cuando el caso de uso de marcar batch fallido permanente se ejecuta
    Entonces no se lanza ninguna excepción

  Escenario: El caso de uso marca el registro como reintentable cuando ocurre un error de infraestructura
    Dado un batch DLQ de 2 registros donde uno causa un error de infraestructura
    Cuando el caso de uso de marcar batch fallido permanente se ejecuta
    Entonces el resultado contiene 1 registro reintentable

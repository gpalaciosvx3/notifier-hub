# language: es
Característica: Procesamiento Batch DLQ

  Esquema del escenario: markFailed retorna <resultado> según la existencia del registro
    Dado un registro DLQ con notificationId "<notificationId>"
    Y la actualización en DDB retorna <resultado> para "<notificationId>"
    Cuando el servicio de batch DLQ marca el registro como fallido
    Entonces el resultado es <resultado>

    Ejemplos:
      | notificationId | resultado |
      | NOTIF-001      | true      |
      | NOTIF-999      | false     |

  Escenario: El caso de uso completa sin lanzar excepción cuando todos los registros son actualizados
    Dado un batch DLQ de 2 registros donde todas las actualizaciones tienen éxito
    Cuando el caso de uso de marcar batch fallido permanente se ejecuta
    Entonces no se lanza ninguna excepción

  Escenario: El caso de uso completa sin lanzar excepción cuando algunos registros no se encuentran
    Dado un batch DLQ de 2 registros donde uno no se encuentra en DDB
    Cuando el caso de uso de marcar batch fallido permanente se ejecuta
    Entonces no se lanza ninguna excepción

  Escenario: El caso de uso lanza NTF-010 cuando ocurre un error de infraestructura
    Dado un batch DLQ de 2 registros donde uno causa un error de infraestructura
    Cuando el caso de uso de marcar batch fallido permanente se ejecuta
    Entonces se lanza una CustomException con código "NTF-010"

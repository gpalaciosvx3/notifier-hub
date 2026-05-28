# language: es
Característica: Procesamiento Worker

  Escenario: El servicio de procesamiento envía y marca SENT cuando toma el lock
    Dado una notificación PENDING con ID "NOTIF-001" para canal "email:ses"
    Y la actualización condicional para "NOTIF-001" tiene éxito
    Cuando el servicio de procesamiento procesa la notificación
    Entonces el método send del remitente es invocado
    Y la notificación es marcada como "SENT"

  Escenario: El servicio de procesamiento omite cuando no toma el lock
    Dado una notificación PENDING con ID "NOTIF-001" para canal "email:ses"
    Y la actualización condicional para "NOTIF-001" falla
    Cuando el servicio de procesamiento procesa la notificación
    Entonces el estado de la notificación no es actualizado

  Esquema del escenario: processSafe revierte la notificación a PENDING y relanza la excepción cuando el envío falla
    Dado una notificación PENDING con ID "NOTIF-001" para canal "email:ses"
    Y la actualización condicional para "NOTIF-001" tiene éxito
    Y el remitente lanza "<tipo_error>" al intentar enviar
    Cuando el servicio de procesamiento procesa de forma segura la notificación
    Entonces la notificación es revertida a "PENDING"
    Y la excepción original es relanzada

    Ejemplos:
      | tipo_error                  |
      | un error genérico           |
      | una CustomException NTF-006 |

  Escenario: El caso de uso de batch no retorna registros reintentables cuando todos tienen éxito
    Dado un batch de 2 registros SQS donde todo el procesamiento tiene éxito
    Cuando el caso de uso de procesamiento de batch se ejecuta
    Entonces la lista de registros reintentables está vacía

  Escenario: El caso de uso de batch incluye el registro fallido como reintentable
    Dado un batch de 1 registro SQS donde el procesamiento falla
    Cuando el caso de uso de procesamiento de batch se ejecuta
    Entonces la lista de registros reintentables contiene 1 elemento

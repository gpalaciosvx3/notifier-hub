# language: es
Característica: Procesamiento Worker

  Escenario: El router de canal resuelve un remitente conocido
    Dado un remitente registrado para "email:ses"
    Cuando el router de canal resuelve canal "email" y proveedor "ses"
    Entonces el remitente registrado es retornado

  Escenario: El router de canal lanza NTF-006 para una combinación desconocida
    Dado ningún remitente registrado para "email:unknown"
    Cuando el router de canal resuelve canal "email" y proveedor "unknown"
    Entonces se lanza una CustomException con código "NTF-006"

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

  Esquema del escenario: handleFault revierte la notificación a PENDING independientemente del tipo de error
    Dado una notificación PENDING con ID "NOTIF-001" para canal "email:ses"
    Cuando el servicio de procesamiento maneja un fallo con "<tipo_error>"
    Entonces la notificación es revertida a "PENDING"
    Y se retorna false

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

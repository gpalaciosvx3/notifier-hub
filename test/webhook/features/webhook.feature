# language: es
Característica: Webhook Dispatcher

  Escenario: POST exitoso al callbackUrl actualiza webhookStatus a DELIVERED
    Dado una notificación con callbackUrl "https://example.com/callback" y estado "SENT"
    Y el repositorio HTTP retorna éxito en el POST
    Cuando el servicio de despacho procesa el evento
    Entonces el repositorio actualiza webhookStatus a "DELIVERED"
    Y el estado de la notificación no es modificado

  Escenario: POST fallido lanza error para reintento SQS sin actualizar webhookStatus
    Dado una notificación con callbackUrl "https://example.com/callback" y estado "SENT"
    Y el repositorio HTTP retorna fallo en el POST
    Cuando el servicio de despacho procesa el evento
    Entonces se lanza una CustomException con código "NTF-016"
    Y el webhookStatus no es actualizado

  Escenario: El impl HTTP reintenta el POST 3 veces antes de retornar false
    Dado un endpoint que siempre falla al recibir el POST
    Cuando el impl HTTP intenta el POST
    Entonces el fetch es invocado exactamente 3 veces
    Y se retorna false

  Escenario: Mensaje SQS sin callbackUrl genera registro descartado en el batch
    Dado un batch con un mensaje SQS sin campo callbackUrl
    Cuando el caso de uso de batch se ejecuta
    Entonces ese registro es descartado sin reintento

  Escenario: Batch donde todos los despachos tienen éxito no retorna reintentables
    Dado un batch de 2 mensajes SQS con callbackUrl válido
    Y todos los despachos tienen éxito
    Cuando el caso de uso de batch se ejecuta
    Entonces la lista de registros reintentables está vacía

  Escenario: Batch con un despacho fallido retorna ese registro como reintentable
    Dado un batch de 2 mensajes SQS con callbackUrl válido
    Y el primer despacho falla
    Cuando el caso de uso de batch se ejecuta
    Entonces la lista de registros reintentables contiene 1 elemento

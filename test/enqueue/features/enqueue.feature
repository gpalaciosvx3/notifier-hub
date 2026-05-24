# language: es
Característica: Encolar Notificación

  Escenario: Construir una notificación de email válida crea una entidad PENDING
    Dado un comando de construcción para canal "email", destinatario "user@example.com", asunto "Hello", proveedor "ses" y cuerpo "Test body"
    Cuando el servicio de notificación construye la entidad
    Entonces el estado de la entidad es "PENDING"
    Y la entidad tiene un notificationId
    Y el canal de la entidad es "email"

  Esquema del escenario: Construir una notificación con datos inválidos lanza la excepción correspondiente
    Dado un comando de construcción para canal "<canal>", destinatario "<destinatario>", asunto "<asunto>", proveedor "<proveedor>" y cuerpo "Test body"
    Cuando el servicio de notificación intenta construir la entidad
    Entonces se lanza una CustomException con código "<codigo>"

    Ejemplos:
      | canal | destinatario     | asunto | proveedor | codigo  |
      | email | invalid-email    | Hello  | ses       | NTF-001 |
      | sms   | 12345            |        | sns       | NTF-002 |
      | email | user@example.com | Hello  | sns       | NTF-003 |
      | email | user@example.com |        | ses       | NTF-004 |

  Escenario: Construir una notificación de SMS válida crea una entidad PENDING
    Dado un comando de construcción para canal "sms", destinatario "+15551234567", proveedor "sns" y cuerpo "Test body"
    Cuando el servicio de notificación construye la entidad
    Entonces el estado de la entidad es "PENDING"
    Y el canal de la entidad es "sms"

  Escenario: Encolar una notificación válida la persiste y registra el evento de outbox
    Dado un payload de encolar válido con canal "email", destinatario "user@example.com", asunto "Hello" y cuerpo "Test body"
    Cuando el caso de uso de encolar se ejecuta
    Entonces se retorna un ID de notificación
    Y la notificación es guardada en la base de datos
    Y el evento de outbox es registrado junto a la notificación

  Escenario: Encolar un payload sin canal lanza una ValidationException
    Dado un payload de encolar sin el campo canal
    Cuando el caso de uso de encolar se ejecuta
    Entonces se lanza una ValidationException con código "NTF-009"

  Escenario: Encolar una notificación con scheduledAt futuro la persiste con estado SCHEDULED
    Dado un payload de encolar con canal "email", destinatario "user@example.com", asunto "Hello", cuerpo "Test body" y scheduledAt en el futuro
    Cuando el caso de uso de encolar se ejecuta
    Entonces se retorna un ID de notificación
    Y la notificación es guardada con estado "SCHEDULED"
    Y el evento de outbox es de tipo "NOTIFICATION_SCHEDULED"

  Escenario: Encolar una notificación con scheduledAt pasado lanza ValidationException
    Dado un payload de encolar con scheduledAt en el pasado
    Cuando el caso de uso de encolar se ejecuta
    Entonces se lanza una ValidationException con código "NTF-009"

  Escenario: Solicitud sin callbackUrl es rechazada (gate 1)
    Dado un payload de encolar sin el campo callbackUrl
    Cuando el caso de uso de encolar se ejecuta
    Entonces se lanza una ValidationException con código "NTF-009"

  Escenario: Segunda solicitud con la misma Idempotency-Key retorna el resultado original sin reprocesar (gate 2)
    Dado un payload válido y una Idempotency-Key ya procesada con notificationId "01EXISTENTE00000000000000"
    Cuando el caso de uso de encolar se ejecuta con la misma Idempotency-Key
    Entonces se retorna el notificationId original "01EXISTENTE00000000000000"
    Y no se persiste ninguna notificación nueva

  Escenario: Idempotency-Key expirada se trata como nueva solicitud
    Dado un payload válido y una Idempotency-Key sin registro previo
    Cuando el caso de uso de encolar se ejecuta con esa Idempotency-Key
    Entonces se retorna un ID de notificación
    Y la notificación es guardada en la base de datos

  Escenario: Solicitud con templateId inexistente es rechazada (gate 3)
    Dado un payload de encolar con templateId "TMPL-NO-EXISTE"
    Cuando el caso de uso de encolar se ejecuta
    Entonces se lanza una CustomException con código "NTF-013"

  Escenario: Solicitud válida con template persiste la notificación con cuerpo renderizado y evento de outbox atómico
    Dado un payload de encolar con templateId activo "TMPL-001"
    Cuando el caso de uso de encolar se ejecuta
    Entonces se retorna un ID de notificación
    Y la notificación es guardada en la base de datos
    Y el evento de outbox es registrado junto a la notificación

  Escenario: Solicitud válida en modo inline persiste la notificación con evento de outbox atómico
    Dado un payload de encolar válido con canal "email", destinatario "user@example.com", asunto "Hello" y cuerpo "Test body"
    Cuando el caso de uso de encolar se ejecuta
    Entonces se retorna un ID de notificación
    Y la notificación es guardada en la base de datos
    Y el evento de outbox es registrado junto a la notificación

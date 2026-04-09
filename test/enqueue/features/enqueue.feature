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

  Escenario: Encolar una notificación válida la persiste y encola
    Dado un payload de encolar válido con canal "email", destinatario "user@example.com", asunto "Hello" y cuerpo "Test body"
    Cuando el caso de uso de encolar se ejecuta
    Entonces se retorna un ID de notificación
    Y la notificación es guardada en la base de datos
    Y la notificación es enviada a la cola

  Escenario: Encolar un payload sin canal lanza una ValidationException
    Dado un payload de encolar sin el campo canal
    Cuando el caso de uso de encolar se ejecuta
    Entonces se lanza una ValidationException con código "NTF-009"

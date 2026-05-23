# language: es
Característica: Relay de eventos de outbox

  Esquema del escenario: El relay publica el evento según su tipo y lo marca como publicado
    Dado un evento de outbox de tipo "<tipo_evento>" con payload válido
    Cuando el servicio relay procesa el evento
    Entonces la estrategia "<estrategia>" es invocada para publicar
    Y el evento es marcado como publicado en el repositorio de outbox

    Ejemplos:
      | tipo_evento             | estrategia   |
      | NOTIFICATION_CREATED    | notificacion |
      | NOTIFICATION_SCHEDULED  | scheduler    |
      | WEBHOOK_REQUESTED       | webhook      |

  Escenario: Fallo de publicación no actualiza publishedAt
    Dado un evento de outbox de tipo "NOTIFICATION_CREATED" con payload válido
    Y la estrategia de notificación lanza un error al publicar
    Cuando el servicio relay intenta procesar el evento
    Entonces el evento no es marcado como publicado en el repositorio de outbox

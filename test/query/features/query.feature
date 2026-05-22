# language: es
Característica: Consultar Notificación

  Escenario: Buscar por ID retorna la notificación cuando existe
    Dado una notificación con ID "NOTIF-001" existe en la base de datos
    Cuando el servicio de consulta busca por ID "NOTIF-001"
    Entonces la entidad de notificación es retornada

  Escenario: Buscar por ID lanza NTF-005 cuando la notificación no existe
    Dado ninguna notificación con ID "NOTIF-999" existe en la base de datos
    Cuando el servicio de consulta busca por ID "NOTIF-999"
    Entonces se lanza una CustomException con código "NTF-005"

  Escenario: Buscar por estado retorna una lista de notificaciones coincidentes
    Dado 2 notificaciones con estado "PENDING" existen en la base de datos
    Cuando el servicio de consulta busca por estado "PENDING"
    Entonces se retorna una lista de 2 notificaciones

  Escenario: Ejecutar el caso de uso con un payload inválido lanza ValidationException
    Dado un payload de consulta inválido sin campos reconocidos
    Cuando el caso de uso de consulta se ejecuta
    Entonces se lanza una ValidationException con código "NTF-009"

  Escenario: Ejecutar el caso de uso con un ID válido delega al servicio de consulta
    Dado una notificación con ID "NOTIF-001" existe en la base de datos
    Cuando el caso de uso de consulta se ejecuta con id "NOTIF-001"
    Entonces la entidad de notificación es retornada

  Escenario: Consulta por destinatario con resultados retorna la lista ordenada de más reciente a más antigua
    Dado que existen 3 notificaciones para el destinatario "user@acme.com"
    Cuando el caso de uso de consulta por destinatario se ejecuta con to "user@acme.com"
    Entonces se retorna una lista paginada con 3 elementos sin token de siguiente página

  Escenario: Consulta por destinatario sin resultados retorna lista vacía
    Dado que no existen notificaciones para el destinatario "nuevo@acme.com"
    Cuando el caso de uso de consulta por destinatario se ejecuta con to "nuevo@acme.com"
    Entonces se retorna una lista paginada vacía sin error

  Escenario: Consulta paginada retorna los primeros resultados y un token de siguiente página
    Dado que existen 25 notificaciones para el destinatario "user@acme.com" y el repositorio indica que hay más resultados
    Cuando el caso de uso de consulta por destinatario se ejecuta con to "user@acme.com"
    Entonces se retorna una lista paginada con 20 elementos y un token de siguiente página

  Escenario: Consulta con token de página retorna el siguiente bloque de resultados
    Dado que existen 5 notificaciones en la segunda página para el destinatario "user@acme.com"
    Cuando el caso de uso de consulta por destinatario se ejecuta con to "user@acme.com" y pageToken "TOKEN-002"
    Entonces se retorna una lista paginada con 5 elementos sin token de siguiente página

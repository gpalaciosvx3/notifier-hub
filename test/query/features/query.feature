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

# Diagrama de clases

FitPocket está escrito en JavaScript, así que no todo es una `class`: los modelos son esquemas de Mongoose y muchos servicios son módulos con funciones. En el diagrama se representan igual, como clases con sus atributos y operaciones, para mostrar la estructura. Refleja el código de `fullStack/backend` a octubre de 2026.

Está dividido en tres partes para que se pueda leer: el modelo de datos, el control de acceso (Composite) y los servicios con los demás patrones.

## 1. Modelo de datos

```mermaid
classDiagram
    direction LR
    class User {
        +ObjectId _id
        +String email
        +String nombre «cifrado»
        +String passwordHash «bcrypt»
        +String rol
        +ObjectId[] familias
        +ObjectId[] patentes
        +Perfil perfil
        +String resetTokenHash
        +Date resetTokenExpira
        +Date passwordCambiadaEn
        +Number dvh
    }
    class Perfil {
        +Number peso
        +Number altura
        +Number edad
        +String sexo
        +String objetivo
        +String nivel
        +String[] diasDispo
        +Number minutosPorSesion
        +String tipoDieta
        +Number presupuesto
        +String[] limitaciones «cifrado»
        +String aclaracion «cifrado»
    }
    class Plan {
        +ObjectId _id
        +ObjectId userId
        +String estado
        +Number version
        +Meta meta
        +DiaRutina[] rutina
        +DiaDieta[] dieta
        +Number dvh
    }
    class DiaRutina {
        +String dia
        +String tipo
        +Number duracionMinutos
        +Ejercicio[] ejercicios
    }
    class DiaDieta {
        +String dia
        +Comida comida
        +Number costoEstimadoDia
    }
    class Checkin {
        +ObjectId _id
        +ObjectId userId
        +ObjectId planId
        +String fecha
        +EstadoDia rutina
        +EstadoDia dieta
        +Number puntajeTotal
        +Number dvh
    }
    class Bitacora {
        +ObjectId userId
        +String accion
        +String metodo
        +String ruta
        +String ip
        +String detalles
        +Number statusCode
        +Date createdAt
    }
    class Patente {
        +String codigo
        +String descripcion
    }
    class Familia {
        +String nombre
        +String descripcion
        +ObjectId[] patentes
        +ObjectId[] familias
    }
    class DigitoVerificadorVertical {
        +String coleccion
        +Number dvv
        +Date actualizadoEn
    }
    class PluginDigitosVerificadores {
        <<plugin Mongoose>>
        +preSave() calcula dvh
        +postUpdate() recalcula dvh de los afectados
        +actualizarDVV(coleccion)
    }

    User *-- Perfil
    Plan *-- DiaRutina
    Plan *-- DiaDieta
    User "1" --> "0..*" Plan : userId
    User "1" --> "0..*" Checkin : userId
    Plan "0..1" --> "0..*" Checkin : planId
    User "0..1" --> "0..*" Bitacora : userId
    User "0..*" --> "0..*" Familia : familias
    User "0..*" --> "0..*" Patente : patentes sueltas
    Familia "0..*" --> "0..*" Patente : patentes
    Familia "0..*" --> "0..*" Familia : familias
    PluginDigitosVerificadores ..> User : se aplica a
    PluginDigitosVerificadores ..> Plan : se aplica a
    PluginDigitosVerificadores ..> Checkin : se aplica a
    PluginDigitosVerificadores ..> DigitoVerificadorVertical : actualiza
```

## 2. Control de acceso (patrón Composite)

```mermaid
classDiagram
    class ComponentePermiso {
        <<abstract>>
        +String nombre
        +obtenerPatentes(visitados) Set~String~
    }
    class PatenteHoja {
        +obtenerPatentes() Set~String~
    }
    class FamiliaCompuesta {
        +String id
        +ComponentePermiso[] hijos
        +agregar(hijo) FamiliaCompuesta
        +obtenerPatentes(visitados) Set~String~
    }
    class permisosService {
        <<módulo>>
        +asegurarPermisosBase()
        +permisosDeUsuario(userId) Set~String~
        +arbolDeUsuario(user, catalogo) FamiliaCompuesta
        +alcanza(familiasIds, objetivoId, catalogo) bool
        +rolDerivado(familiasIds) String
    }
    class requierePatente {
        <<middleware>>
        +requierePatente(...codigos) handler
    }
    ComponentePermiso <|-- PatenteHoja
    ComponentePermiso <|-- FamiliaCompuesta
    FamiliaCompuesta o-- "0..*" ComponentePermiso : hijos
    permisosService ..> FamiliaCompuesta : arma el árbol
    permisosService ..> Familia : lee
    permisosService ..> Patente : lee
    requierePatente ..> permisosService : permisosDeUsuario()
```

## 3. Servicios y patrones

```mermaid
classDiagram
    direction TB
    class EstrategiaIA {
        <<abstract>>
        +String nombre
        +completar(mensajes, temperatura) String
    }
    class GroqStrategy {
        -Groq client
        +String modelo
        +completar(mensajes, temperatura) String
    }
    class OllamaStrategy {
        +String url
        +String modelo
        +completar(mensajes, temperatura) String
    }
    class iaFactory {
        <<Factory Method>>
        +crearEstrategiaIA(proveedor) EstrategiaIA
        +obtenerEstrategiaIA() EstrategiaIA
    }
    class iaService {
        <<módulo>>
        +generarPlan(perfil) Plan
    }
    EstrategiaIA <|-- GroqStrategy
    EstrategiaIA <|-- OllamaStrategy
    iaFactory ..> GroqStrategy : crea
    iaFactory ..> OllamaStrategy : crea
    iaService ..> iaFactory : obtenerEstrategiaIA()

    class EstrategiaAdherencia {
        <<abstract>>
        +Number cantidadDias
        +fechas(hoy) String[]
    }
    class AdherenciaSemanal
    class AdherenciaMensual
    class adherenciaService {
        <<módulo>>
        +calcularAdherencia(datos) Resultado
        +adherenciaDeUsuario(userId, estrategia) Resultado
    }
    EstrategiaAdherencia <|-- AdherenciaSemanal
    EstrategiaAdherencia <|-- AdherenciaMensual
    adherenciaService ..> EstrategiaAdherencia : usa

    class BusDeEventos {
        <<Singleton, Observer>>
        +suscribir(evento, manejador)
        +emitir(evento, datos)
    }
    class bitacoraEventos {
        <<suscriptor>>
        +registrar()
    }
    class alertasAdherencia {
        <<suscriptor>>
        +revisarAdherencia(datos)
    }
    BusDeEventos <.. bitacoraEventos : suscribe
    BusDeEventos <.. alertasAdherencia : suscribe
    alertasAdherencia ..> adherenciaService : AdherenciaSemanal
    alertasAdherencia ..> mailService : enviarAlertaAdherencia()

    class mailService {
        <<módulo>>
        -transporter «Singleton»
        +crearMail(tipo, idioma, datos) Mail «Factory Method»
        +enviarMailDeReset(datos)
        +enviarAlertaAdherencia(datos)
    }
    class connectDB {
        <<Singleton>>
        -Promise conexion
        +connectDB() Promise
    }
    class integridadService {
        <<módulo>>
        +verificarTodo() Resultado
        +recalcularTodo() Resumen
    }
    class backupService {
        <<módulo>>
        +crearBackup() Manifest
        +listarBackups() Backup[]
        +restaurarBackup(nombre) Resultado
    }
    backupService ..> integridadService : recalcularTodo() después del restore
```

Las relaciones entre controladores, rutas y servicios siguen la estructura MVC (RNF10): cada ruta valida el token (`auth`) y la patente (`requierePatente`), y llama a un controlador, que usa los modelos y los servicios. El detalle de cada patrón está en [`patrones-de-diseno.md`](patrones-de-diseno.md).

* /service/src/main/resources/application-local.yml [OLD] /service/src/main/resources/application-compose.yml [NEW]
  * Can I use this application-compose.yml when running in full docker-compose mode? Seems to have something to do with how spring/gradle read these files, `/application-local(\.yml)?/` isn't mentioned anywhere in code
  * => this has to do with spring boot profiles, local is being used. Gradle bootrun task seems to set this. Something like ``./gradlew bootRun --args='--spring.profiles.active=compose'`` could work when running in docker-compose

# שלב 1: בניית הפרויקט
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# אנחנו אומרים ל-Docker במפורש לקחת את הקבצים מתוך תיקיית backend
COPY backend/pom.xml .
COPY backend/src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
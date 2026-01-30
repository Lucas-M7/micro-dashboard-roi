FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY *.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
RUN apt update && apt install -y libgssapi-krb5-2
COPY --from=build /app/out .

EXPOSE 8080
ENTRYPOINT [ "dotnet", "micro-dashboard-roi.dll" ]
REM ########## CD TO KAFKA FOLDER
cd c:\packages\kafka

start bin\windows\zookeeper-server-start.bat config\zookeeper.properties

timeout 1

start bin\windows\kafka-server-start.bat config\server.properties

timeout 3



REM  #########  CD TO stock_screener
cd c:\code\web\stock_screener

cd collectors

start venv\Scripts\python.exe price_kafka.py

start venv\Scripts\python.exe price_db.py



cd ..\db_api\db_api

start ..\venv\Scripts\uvicorn.exe db_api:app



cd ..\..\screener_api

start dotnet run


cd ..\frontend

start npm start








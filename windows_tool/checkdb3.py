import pyodbc

conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=DESKTOP-GL59K6T\\SQLEXPRESS;'
    'DATABASE=AnjaarFinance;'
    'Trusted_Connection=yes;'
    'TrustServerCertificate=yes;'
    'Encrypt=no;'
)

cursor = conn.cursor()

print("=== GnCusFolio ALL columns ===")
cursor.execute('SELECT TOP 1 * FROM GnCusFolio')
cols = [col[0] for col in cursor.description]
for c in cols:
    print(c)

conn.close()
input("Press Enter to exit...")

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

print("=== FnAgLedgers columns ===")
cursor.execute('SELECT TOP 1 * FROM FnAgLedgers')
print([col[0] for col in cursor.description])

print("\n=== FnAgCollFollow columns ===")
cursor.execute('SELECT TOP 1 * FROM FnAgCollFollow')
print([col[0] for col in cursor.description])

conn.close()
print("\nDone!")
input("Press Enter to exit...")

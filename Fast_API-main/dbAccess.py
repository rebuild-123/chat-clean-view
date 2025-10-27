import psycopg2
import json

def looking_concall_trans(code:str):
    # 建立連線
    conn = psycopg2.connect(
        host="192.168.1.100",
        port=32432,
        user="aiuser",      # 請填入你在 DBeaver 使用的帳號
        password="fuhwatrust1688",  # 請填入密碼
        dbname="AI"
    )

    # 建立游標
    cursor = conn.cursor()

    # 執行 SQL 查詢
    cursor.execute('SELECT * FROM public."Conference_Call" WHERE "ticker" = %s AND "transcript" IS NOT NULL;', (code,))

    # ← 改成你想查的資料表


    # 取得結果
    rows = cursor.fetchall()
        
    # 取得欄位名稱
    columns = [desc[0] for desc in cursor.description]

    # === 將每一筆資料轉成 dict (欄位名:值) ===
    data = [dict(zip(columns, row)) for row in rows]

    # 輸出結果
    for row in rows:
        # print(row)

        json_data = json.dumps(data, ensure_ascii=False, indent=2, default=str)
    # 關閉資源
    cursor.close()
    conn.close()

    return json_data

# if __name__ == '__main__':
#     print(
#         looking_concall_trans("2317") 
#         )
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

    # 查詢
    cursor.execute(
        '''
        SELECT id, market, ticker, company_name, transcript
        FROM public."Conference_Call"
        WHERE "ticker" = %s AND if_concall IS TRUE;
        ''',
        (code,)
    )

    rows = cursor.fetchall()

    # 若無資料，回傳預設空值
    if not rows:
        default_data = {
            "id": 0000,
            "market": "XX",
            "ticker": "0000",
            "company_name": "",
            "transcript": ""
        }
        return json.dumps([default_data], ensure_ascii=False, indent=2)

    # 取得欄位名稱
    columns = [desc[0] for desc in cursor.description]

    # 處理每一筆資料
    data = []
    for row in rows:
        row_dict = dict(zip(columns, row))
        # 若 transcript 為 None，替換成空字串
        if row_dict.get("transcript") is None:
            row_dict["transcript"] = ""
        data.append(row_dict)

    json_data = json.dumps(data, ensure_ascii=False, indent=2, default=str)

    cursor.close()
    conn.close()

    return json_data

if __name__ == '__main__':
    print(
        looking_concall_trans("1101") 
        )
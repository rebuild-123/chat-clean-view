import requests

url = "http://127.0.0.1:8000/reply"
data = {"message": "這是我從 Python 傳的訊息"}

response = requests.post(url, json=data)
print("狀態碼:", response.status_code)
print("回傳內容:", response.json())

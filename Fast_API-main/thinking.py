from openai import OpenAI

import httpx

import json

import dbAccess

# 設定 URL 與 API Key
client = OpenAI(
    # api_key="your_openai_api_key_here",  # Replace with your actual API key
    api_key="123",
    base_url="http://ai-server1.fhtrust.com.tw/prd/fhai_proxy/v1"
    # http_client=httpx.Client(verify=False, timeout=30.0)
)

def simplify_questions(query:str):
    # 呼叫 LLM
    # response = client.responses.create(
    # model="azure/gpt-5",
    # input='以下是用戶傳入的問題，請告訴他問的公司是哪一家以及問題是什麼 /n' + query + "回答請用以下schema {'code':公司代號, 'question':用戶的問題}" 
    # )
    response = client.chat.completions.create(
        model="azure/gpt-4o",
        messages=[
            {'role':'user','content':'you are a great stock analyst'},
            {'role':'user','content':'以下是用戶傳入的問題，請告訴他問的公司是哪一家以及問題是什麼 /n' + query + "回答請用以下schema {'code':公司代號, 'question':用戶的問題}" }
        ]  
    )
    print(response.choices[0].message.content)
    return response.choices[0].message.content

def answering(query:str):

    re = simplify_questions(query)
    re = re.replace("'", '"')
    re = json.loads(re)

    trans = dbAccess.looking_concall_trans(re['code'])

    # 呼叫 LLM
    response = client.chat.completions.create(
        model="azure/gpt-4o",
        messages=[
            {'role':'user','content':'you are a great stock analyst'},
            {'role':'user','content':re['question'] + "以上是問題，請根據以下的資料回答，若是資料為空，請誠實回答暫無資料" + trans}
        ]  
    )
    
    return response.choices[0].message.content

if __name__ == '__main__':
    print(
        answering("請告訴我環泥1104 法說會在說什麼")
        )
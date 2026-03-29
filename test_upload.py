import requests
with open('images/example1.png', 'rb') as f:
    files = {'image': f}
    response = requests.post('http://localhost:5000/', files=files)
print(response.status_code)
print(response.text)

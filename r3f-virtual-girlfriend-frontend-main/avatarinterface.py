import requests




def sendMsgToAvatar(message):
    # URL to express js endpoint
    url = "http://localhost:3001/transmitmessage"

    # Data in post request body
    data = {"message":message}

    # Send the POST request
    response = requests.post(url, json=data)

    # Print the response from the server
    # print(response.text)


 1. this little server runs, waiting for clients to send requests.
 2. if the request has a valid known password, then the server stores the client's IP in a simple SQLite DB, making sure to forget the previous IP of the client (so password-ip pairs are stored)
 
 3. crowdsec parser discards events with the listed IPs
    
    https://docs.crowdsec.net/docs/expr/helpers#filefilename-string provides a cache too

    ```
    evt.Parsed.some_field in File('ip-allowlist.txt')
    ```



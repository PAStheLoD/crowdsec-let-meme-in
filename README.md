

 1. this little server runs via systemd (or docker), preferably behind an Nginx reverse proxy (which handles TLS), waiting for clients to send requests.

    ```
    location /security/allowlist {
        proxy_set_header   X-Real-IP $remote_addr;

        # dynamic allowlist for crowdsec thingie
        proxy_pass http://127.0.0.1:7891;
    }
    ```


 2. if the request has a valid known password, then the server stores the client's IP in a simple SQLite DB, making sure to forget the previous IP of the client (so password-ip pairs are stored)

    ```
    ./server.ts --add-client pw22222
    ```
 
 3. crowdsec parser discards events with the listed IPs
    
    https://docs.crowdsec.net/docs/expr/helpers#filefilename-string provides a cache too

    ```
    evt.Parsed.some_field in File('ip-allowlist.txt')
    ```
 4. dear user sets up something like this on startup

    # windows

    put a .cmd file in "$Env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"

    ```

    rem PowerShell -Command "Set-ExecutionPolicy Unrestricted"
    PowerShell %USERPROFILE%\Documents\PowerShell\ip-dynamic-bump.ps1 >> "%TEMP%\StartupLog.txt" 2>&1

    ```

    and have a nice PS script, like this


    ```
    $postParams = @{username='not me';password='abc-def-676097154-zyz'}

    Invoke-WebRequest -Uri https://where.you.deploy.ed/security/allowlist -Method POST -Body $postParams

    ```


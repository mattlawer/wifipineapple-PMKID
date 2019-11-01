# wifipineapple-PMKID

PMKID module for the WiFi Pineapple using hcxdumptool and hcxtools from [https://github.com/adde88/besside-ng_pineapple](https://github.com/adde88/hcxtools-hcxdumptool-openwrt).

## How to Install

1) Connect to your WiFi Pineapple Management AP
2) SCP the PMKID directory in /pineapple/modules/ on the WiFi Pineapple. 

![SCP](https://raw.githubusercontent.com/mattlawer/wifipineapple-PMKID/master/screenshots/scp.png)

        scp -r PMKID root@172.16.42.1:/pineapple/modules/
    
3) SSH into the WiFi Pineapple to change the owner and permissions

![SSH](https://raw.githubusercontent.com/mattlawer/wifipineapple-PMKID/master/screenshots/ssh.png)

        # Change owner of the module
        chown -R root:root /pineapple/modules/PMKID/

        # Add execute permission to the scripts
        chmod +x /pineapple/modules/PMKID/scripts/*

4) Refresh the WiFi Pineapple web interface, go to Modules->PMKID and click install.

![Preview](https://raw.githubusercontent.com/mattlawer/wifipineapple-PMKID/master/screenshots/preview.png)
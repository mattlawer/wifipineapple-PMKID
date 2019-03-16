#!/bin/sh
#2019 - mattlawer & adde88

export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/sd/lib:/sd/usr/lib
export PATH=$PATH:/sd/usr/bin:/sd/usr/sbin

[[ -f /tmp/PMKID.progress ]] && {
  exit 0
}

touch /tmp/PMKID.progress

if [ "$1" = "install" ]; then
  # Let's always get the latest version
  mkdir -p /tmp/HcxTools
  wget https://github.com/adde88/hcxtools-hcxdumptool-openwrt/tree/master/bin/ar71xx/packages/base -P /tmp/HcxTools
  HCXDUMPTOOL=`grep -F "hcxdumptool_" /tmp/HcxTools/base | awk {'print $5'} | awk -F'"' {'print $2'} | grep "ar71xx" `
  HCXTOOLS=`grep -F "hcxtools_" /tmp/HcxTools/base | awk {'print $5'} | awk -F'"' {'print $2'} | grep "ar71xx"`

  # Download latest IPK's to temp directory, and then update OPKG repositories.
  cd /tmp
  opkg update
  wget "https://github.com/adde88/hcxtools-hcxdumptool-openwrt/raw/master/bin/ar71xx/packages/base/"$HCXTOOLS""
  wget "https://github.com/adde88/hcxtools-hcxdumptool-openwrt/raw/master/bin/ar71xx/packages/base/"$HCXDUMPTOOL""

  if [ "$2" = "internal" ]; then
    # Tetra install / general install.
	  opkg install "$HCXTOOLS" "$HCXDUMPTOOL"
  elif [ "$2" = "sd" ]; then
    # Nano install (Let's use the SD-card)
	  opkg --dest sd install "$HCXTOOLS" "$HCXDUMPTOOL"
  fi

  touch /etc/config/PMKID
  echo "config PMKID 'module'" > /etc/config/PMKID
  echo "config PMKID 'run'" >> /etc/config/PMKID
  echo "config PMKID 'autostart'" >> /etc/config/PMKID

  uci set PMKID.module.installed=1
  uci commit PMKID.module.installed

  # Cleanup
  rm -rf "$HCXTOOLS" "$HCXDUMPTOOL" /tmp/HcxTools/
  echo -e "${RED}Installation completed!"

elif [ "$1" = "remove" ]; then
  opkg remove hcxdumptool hcxtools
fi

rm /tmp/PMKID.progress
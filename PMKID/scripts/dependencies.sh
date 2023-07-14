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
  HCXDUMPTOOL="6.1.5/hcxdumptool-custom_6.1.5-3_mips_24kc.ipk"
  HCXTOOLS="6.1.5/hcxtools-custom_6.1.5-3_mips_24kc.ipk"

  # Download latest IPK's to temp directory, and then update OPKG repositories.
  cd /tmp
  opkg update
  wget "https://github.com/adde88/hcxtools-hcxdumptool-openwrt/releases/download/"$HCXTOOLS""
  wget "https://github.com/adde88/hcxtools-hcxdumptool-openwrt/releases/download/"$HCXDUMPTOOL""

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
  rm -rf "$HCXTOOLS" "$HCXDUMPTOOL"
  echo -e "${RED}Installation completed!"

elif [ "$1" = "remove" ]; then
  opkg remove hcxdumptool hcxtools
fi

rm /tmp/PMKID.progress

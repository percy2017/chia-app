import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countryCodeNative } from '../../phone/native';
import { useTheme } from '../theme';
import {
  allCountries,
  findCountry,
  formatNational,
  guessCountry,
  nationalOf,
} from './phone';
import type { Country } from './phone';

/**
 * Campo de telefono con selector de pais (bandera + prefijo) y formato
 * automatico. El padre guarda el telefono completo (prefijo + nacional).
 */
export function PhoneField({
  label = 'Telefono',
  value,
  onChange,
  error,
  hint,
  onFocus,
  editable = true,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  onFocus?: () => void;
  editable?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const initial = useRef<Country | undefined>(guessCountry(value));
  const [country, setCountry] = useState<Country | undefined>(initial.current);
  const [national, setNational] = useState<string>(
    initial.current ? nationalOf(value, initial.current) : value.replace(/\D/g, ''),
  );
  const [text, setText] = useState<string>(
    initial.current ? formatNational(initial.current.code, nationalOf(value, initial.current)) : value,
  );
  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState('');

  // Sin telefono guardado: el pais lo dice la ubicacion (GPS), la SIM o el locale.
  useEffect(() => {
    if (country) {
      return;
    }
    let alive = true;
    void countryCodeNative()
      .then((iso) => {
        const detected = iso ? findCountry(iso) : undefined;
        if (!alive || !detected) {
          return;
        }
        setCountry(detected);
        setText(formatNational(detected.code, national));
        if (national) {
          onChange(detected.dial + national);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // Solo al montar: despues manda la eleccion del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeText = useCallback(
    (raw: string) => {
      if (!country) {
        const digits = raw.replace(/\D/g, '').slice(0, 15);
        setNational(digits);
        setText(raw.startsWith('+') ? `+${digits}` : digits);
        onChange(digits);
        return;
      }
      const digits = raw.replace(/\D/g, '').slice(0, 15 - country.dial.length);
      setNational(digits);
      setText(formatNational(country.code, digits));
      onChange(country.dial + digits);
    },
    [country, onChange],
  );

  const onPick = useCallback(
    (next: Country) => {
      setPicker(false);
      setSearch('');
      setCountry(next);
      setText(formatNational(next.code, national));
      onChange(next.dial + national);
    },
    [national, onChange],
  );

  const list = useMemo(() => {
    const query = search.trim().toLowerCase();
    const source = allCountries();
    if (!query) {
      return source;
    }
    const digits = query.replace(/\D/g, '');
    return source.filter(item =>
      item.name.toLowerCase().includes(query)
      || item.code.toLowerCase().startsWith(query)
      || (digits ? item.dial.startsWith(digits) : false),
    );
  }, [search]);

  const borderColor = error ? c.danger : c.border;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <View style={[styles.row, { borderColor, backgroundColor: c.surface }]}>
        <Pressable
          onPress={() => setPicker(true)}
          disabled={!editable}
          style={[styles.country, { borderRightColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel="Elegir pais"
        >
          <Text style={styles.flag}>{country ? country.flag : '🌐'}</Text>
          <Text style={[styles.dial, { color: c.text }]}>
            {country ? `+${country.dial}` : '+'}
          </Text>
          <Text style={[styles.caret, { color: c.muted }]}>▾</Text>
        </Pressable>
        <TextInput
          value={text}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder=""
          placeholderTextColor={c.muted}
          keyboardType="phone-pad"
          editable={editable}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: c.text }]}
        />
      </View>
      {error ? (
        <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: c.muted }]}>{hint}</Text>
      ) : null}

      <Modal
        visible={picker}
        transparent
        animationType="fade"
        onRequestClose={() => setPicker(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setPicker(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: c.bg,
                borderColor: c.border,
                paddingBottom: insets.bottom + 8,
              },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.sheetTitle, { color: c.text }]}>Pais</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar"
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.search, { color: c.text, borderColor: c.border }]}
            />
            <FlatList
              data={list}
              keyExtractor={item => item.code}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={24}
              renderItem={({ item }) => {
                const active = item.code === country?.code;
                return (
                  <Pressable
                    onPress={() => onPick(item)}
                    style={[styles.item, { borderBottomColor: c.border }]}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <Text
                      style={[styles.itemName, { color: active ? c.accent : c.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.itemDial, { color: c.muted }]}>+{item.dial}</Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  country: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
  },
  flag: {
    fontSize: 17,
  },
  dial: {
    fontSize: 14,
    fontWeight: '600',
  },
  caret: {
    fontSize: 10,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  hint: {
    fontSize: 11,
    marginTop: 5,
  },
  error: {
    fontSize: 11,
    marginTop: 5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  search: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    marginBottom: 8,
  },
  list: {
    flexGrow: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemFlag: {
    fontSize: 19,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
  },
  itemDial: {
    fontSize: 13,
  },
});

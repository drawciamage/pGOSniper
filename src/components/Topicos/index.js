/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { GuardarItem, PegarItem } from '../../util/AsyncStorage';
import FormatDate from '../../util/FormatDate';
import api from '../../config/Api';

import styles from './styles';

export default function Topicos(props) {
  const [hournow, setHournow] = useState(new Date());
  const [children, setChildren] = useState([]);

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      if (state.isConnected) {
        loadTopics();
      } else {
        loadStorage();
      }
    });
  }, []);

  const loadStorage = async () => {
    const response = JSON.parse(await PegarItem('@topics'));

    const { children } = response.data.data;

    setChildren(children);

    alert('Não foi possivel se conectar a internet.');
  };

  const loadTopics = async () => {
    let response = await api.get(
      '/r/PokemonGoSniping/new.json?sort=new&limit=5',
    );

    for (let index = 0; index < response.data.data.children.length; index++) {
      await api
        .get(
          `${response.data.data.children[index].data.permalink}.json?sort=old&limit=1`,
        )
        .then((res) => {
          response.data.data.children[index].data.selftext_html =
            res.data[1].data.children[0].data.body;
        })
        .catch((error) => {
          response.data.data.children[index].data.selftext_html =
            'Erro ao pegar coordenadas';
        });
      response.data.data.children[index].data.approved_at_utc = FormatDate(
        response.data.data.children[index].data.created_utc,
        hournow,
      );
    }

    const { children } = response.data.data;
    await GuardarItem('@topics', JSON.stringify(response));

    setChildren(children);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.topicContainer, styles[props.theme]]}>
      <Text style={[styles.fs18Text, styles.boldText, styles[props.theme]]}>
        {item.data.title}
      </Text>
      <View style={styles.rowContainer}>
        <Text style={[styles.topicAuthor, styles[props.theme]]}>
          Publicado por: {item.data.author}{' '}
        </Text>
        <Text style={[styles.topicAuthor, styles[props.theme]]}>
          a {item.data.approved_at_utc} atrás
        </Text>
      </View>
      <Text
        style={[styles.topicDescription, styles.fs16Text, styles[props.theme]]}>
        {item.data.selftext}
      </Text>
      <View style={[styles.coordsContainer, styles.rowContainer]}>
        <TextInput
          style={[
            styles.topicCoord,
            styles.fs18Text,
            styles.boldText,
            styles[props.theme],
          ]}>
          {item.data.selftext_html}
        </TextInput>
        <Text />
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => {
            Clipboard.setString(item.data.selftext_html);
          }}>
          <Text
            style={[styles.copyButtonText, styles.fs16Text, styles.boldText]}>
            Copiar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!children) return null;

  return (
    <FlatList
      data={children}
      keyExtractor={(item) => String(item.data.created_utc)}
      renderItem={renderItem}
    />
  );
}

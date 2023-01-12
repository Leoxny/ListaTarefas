import { StyleSheet, Text, View, SafeAreaView, StatusBar,TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import {Ionicons} from '@expo/vector-icons'
import React, {useState, useEffect} from 'react';
import TaskList from './src/components/TaskList'
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import Task from './src/components/TaskList/services/sqlite/Task'
import * as SQLite from 'expo-sqlite';

const AnimatableBtn = Animatable.createAnimatableComponent(TouchableOpacity)

const db = SQLite.openDatabase("db.db");

export default function App() {

  const [task, setTask] = useState("")
  const [tasks, setTasks] = useState([])
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState(inputVazio)

  const inputVazio = {
    input: ''
  }

  const createTables = () => {
    try{
      db.transaction(txn => {
        txn.executeSql(
          `CREATE TABLE IF NOT EXISTS task (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao VARCHAR(100))`,
          [],
          (sqlTxn, res) => {
            console.log("tabela criada com sucesso");
          },
        );
      });
    }catch(err){
      console.log("ERRO AO CRIAR TABELA=>", err);
    }
  };

  const addTask = () => {
    try{
      if (!input) {
        alert("Preencha o campo")
        return false;
      }
      db.transaction(txn => {
        txn.executeSql(
          `INSERT INTO task (descricao) VALUES (?)`,
          [input],
          (sqlTxn, res) => {
            console.log(`${input} adicionada com sucesso`);
            getTasks();
            setTask("");
          },
        );
      });
    }catch (err) {
      console.log('ERRO AO ADICIONAR=>', err);
    }
  };

  const getTasks = () => {
    try{
      db.transaction(txn => {
        txn.executeSql(
          `SELECT * FROM task ORDER BY id DESC`,
          [],
          (sqlTxn, res) => {
            console.log("task recuperadas com suesso");
            let len = res.rows.length;
  
            if (len > 0) {
              let results = [];
              for (let i = 0; i < len; i++) {
                let item = res.rows.item(i);
                results.push({ id: item.id, descricao: item.descricao });
              }
              setTasks(results);
              console.log("RESULTS =>", results);
            }
          },
        );
      });

    }catch(err){
      console.log('ERRO AO OBTER=>', err);
    }
  };

  const renderTask = ({ item }) => {
    return (
      <Animatable.View 
      style={styles.borda}
      animation="bounceIn"
      useNativeDriver 
      >
      <TouchableOpacity data={item} onPress={() => handleDelete(item)}>
          <Ionicons name="md-checkmark-circle" size={30} color={'#121212'}/>
      </TouchableOpacity>
      <View>
          <Text style={styles.task}>{item.descricao}</Text>
      </View>
      </Animatable.View>
    );
  };

  useEffect(() => {
    createTables();
    getTasks();
  }, []);


  const handleDelete = (id) => { 
    db.transaction(txn => {
      txn.executeSql(
        'DELETE FROM task WHERE id = ?',
        [id],
        (sqlTxn, res) => {
          console.log("Exlcuido com sucesso");
        },
        error => {console.log('ERRO AO EXCLUIR =>', error);}
      )
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#171D31" barStyle="light-content"/>

      <View style={styles.content}>
        <Text style={styles.title}>Minhas tarefas</Text>
      </View>

      <FlatList
        marginHorizontal={10}
        showsHorizontalScrollIndicator={false}
        data={tasks}
        renderItem={renderTask}
        key={tasks => tasks.id}
      />

      <Modal animationType='slide' transparent={false} visible={open}>
        <SafeAreaView style={styles.modal}>

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons style={{marginLeft: 5, marginRight: 5}} name="md-arrow-back" size={30} color="#FFF"/>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nova Tarefa</Text>
          </View>

          <Animatable.View style={styles.modalBody} animation="fadeInUp" useNativeDriver>
            <TextInput
            multiline={true}
            placeholderTextColor="#747474"
            autoCorrect={false}
            placeholder='O que precisa fazer hoje?'
            style={styles.input}
            value={inputVazio.input}
            onChangeText={ (texto) => setInput(texto)}
            />
            <TouchableOpacity 
            style={styles.handleAdd} 
            onPress={addTask}
            >
              <Text style={styles.handleAddText}>Cadastrar</Text>
            </TouchableOpacity>

          </Animatable.View>

        </SafeAreaView>
      </Modal>

      <AnimatableBtn 
      style={styles.fab}
      useNativeDriver
      animation="bounceInUp"
      duration={1500}
      onPress={() => setOpen(true)}
      >
        <Ionicons name="ios-add" size={35} color="#FFF"/>
      </AnimatableBtn>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171D31',
  },
  title:{
    marginTop: 10,
    paddingBottom: 10,
    fontSize: 25,
    textAlign: 'center',
    color: '#FFF'
  },
  fab:{
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#0094FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    right: 25,
    bottom: 25,
    elevation: 2,
    zIndex: 9,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset:{
      width: 1,
      height: 3,
    }
  },
  modal:{
    flex: 1,
    backgroundColor: '#171d31',
  },
  modalHeader:{
    marginLeft: 10,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalTitle:{
    marginLeft: 15,
    fontSize: 23,
    color: '#FFF'
  },
  modalBody:{
    marginTop: 15,
  },
  input:{
    fontSize: 15,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 30,
    backgroundColor: '#FFF',
    padding: 9,
    height: 85,
    textAlignVertical: 'top',
    color: '#000',
    borderRadius: 5,
  },
  handleAdd:{
    backgroundColor: '#FFF',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    height: 40,
    borderRadius: 5,
  },
  handleAddText:{
    fontSize: 20,
  },
  task:{
    color: "#121212",
    paddingLeft: 8,
    paddingRight: 20,
    fontSize: 20,
  },
  borda:{
    flex: 1,
    margin: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 5,
    padding: 7,
    elevation: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset:{
        width: 1,
        height: 3,
    }
},
});

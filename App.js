import { StyleSheet, Text, View, SafeAreaView, StatusBar, TouchableOpacity, FlatList, Modal, TextInput, Dimensions } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons'
import React, { useState, useEffect } from 'react';
import * as Animatable from 'react-native-animatable';
import * as SQLite from 'expo-sqlite';
import Checkbox from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';

import {
  PieChart,
} from 'react-native-chart-kit'

//const AnimatableBtn = Animatable.createAnimatableComponent(TouchableOpacity)

const db = SQLite.openDatabase("db.db", 4);

export default function App() {

  /*
  1 listar os useState agrupados;
  2 funções do banco de dados, 1ª função vai ser a de criação do banco

  */
  const [tasks, setTasks] = useState([])
  const [open, setOpen] = useState(false)
  const [openGrafig, setOpenGrafig] = useState(false)

  const [task, setTask] = useState({
    input: '',
    checked: false,
    status: 'Normal'
  })

  const [data, setData] = useState([{
    name: '',
    quant: 0,
    color: '',
    legendFontColor: '',
    legendFontSize: 15
  }])

  // const data = [
  //   { name: 'Seoul', quant: 21500000, color: 'rgba(131, 167, 234, 1)', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  //   { name: 'Toronto', quant: 2800000, color: '#F00', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  //   { name: 'Beijing', quant: 527612, color: 'red', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  //   { name: 'New York', quant: 8538000, color: '#ffffff', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  //   { name: 'Moscow', quant: 11920000, color: 'rgb(0, 0, 255)', legendFontColor: '#7F7F7F', legendFontSize: 15 }
  // ]

  const chartConfig = {
    backgroundGradientFrom: '#1E2923',
    backgroundGradientTo: '#08130D',
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`
  }

  const screenWidth = Dimensions.get('window').width

  useEffect(() => {
    createTables();
    listTasks();
  }, []);

  useEffect(() => {
  }, [tasks]);

  const createTables = () => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS task (id INTEGER PRIMARY KEY AUTOINCREMENT, descricao VARCHAR(100), situacao BOOLEAN, status INTEGER)`,
          [],
          (sqlTx, res) => {
            console.log("tabela criada com sucesso");

            if (db.version >= 4) {

              try {
                db.exec([{ sql: "ALTER TABLE task ADD COLUMN status INTEGER ", args: [] }], false, () => console.log())
              } catch (error) {
                console.log('ALTER_TABLE_TABELA_TASKS', error);
              }
            }

            if (db.version >= 3) {

              try {
                db.exec([{ sql: "ALTER TABLE task ADD COLUMN situacao BOOLEAN ", args: [] }], false, () => console.log())
              } catch (error) {
                console.log('ALTER_TABLE_TABELA_TASKS', error);
              }
            }
            ;
          },
        );
      });


    } catch (error) {
      console.log("ERRO AO CRIAR TABELA=>", error);
    }
  };

  const listTasks = async () => {
    try {
      let tasks_db = await getTasks();
      //console.log('LISTA=>', tasks_db);
      setTasks(tasks_db)
    } catch (error) {
      console.log('ERRO NO LISTA=>', error);
    }
  }

  const listCharts = async () => {
    let data_charts = await getTasksCharts();
    console.log('GRAFICOS=>', data_charts);

    let new_charts = data_charts.map((item) => {
      return {
        name: item.name,
        quant: item.quant,
        color: item.name == 'Abertas' ? '#EF6C00' : '#1565C0',
        legendFontColor: '#B0BEC5',
        legendFontSize: 15
      }
    });
    console.log('GRAFICOS NOVO=>', new_charts);

    setData(new_charts);
  }

  const addTask = () => {
    try {
      if (task.input === '') {
        alert("Preencha o campo")
      }
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO task (descricao, situacao, status) VALUES (?, ?, ?)`,
          [task.input, task.checked, task.status],
          console.log('Oq esta vindo aq=>', task.input, task.checked, task.status),
          (sqlTx, res) => {
            console.log(`${task.input} adicionada com sucesso`);
            listTasks()
          },
        );
      });
    } catch (error) {
      console.log('ERRO AO ADICIONAR=>', error);
    }
  };

  const getTasks = () => {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        //comando SQL modificável
        tx.executeSql(
          "SELECT * FROM task;",
          [],
          //-----------------------
          (_, { rows }) => resolve(rows._array),
          (_, error,) => reject(console.log(error)), // erro interno em tx.executeSql
        );
      });
    });
  };

  const handleUpadteSituacao = (id, situacao) => {
    try {
      db.transaction(tx => {
        if (situacao == 1) {
          tx.executeSql(
            'UPDATE task set situacao = 0 WHERE id = ?',
            [id],
            (sqlTx, res) => {
              console.log('desmarcado com sucesso');
            },
            error => { console.log(error) }
          )
        } else {
          tx.executeSql(
            'UPDATE task set situacao = 1 WHERE id = ?',
            [id],
            (sqlTx, res) => {
              console.log('realizado com sucesso');

            },
            error => { console.log(error) }
          )
        }

        listTasks();

      })
    } catch (error) {
      console.log(error)
    }
  }

  const handleDelete = (id) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'DELETE FROM task WHERE id = ?',
          [id],
          (sqlTx, res) => {
            console.log('exlcuido com sucesso');
            if (res.rowsAffected > 0) {
              //deu certo
              return true;
            } else {
              return false;
            }
          },
          error => {
            console.log(error);
            return false;
          }
        )
      })
    } catch (error) {
      console.log(error)
      return false;
    }
  }

  const cadastrar = () => {
    let list_add = addTask();
    setOpen(list_add)

    if (list_add) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const createTask = () => {
    let task_add = addTask();

    listTasks(task_add)
  }

  const getTasksCharts = () => {
    try {
      return new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT count(situacao) AS quant, CASE situacao WHEN 0 THEN "Abertas" WHEN 1 THEN "Concluidas" END as name FROM task GROUP BY situacao',
            [],
            (_, { rows }) => resolve(rows._array),
            error => { console.log(error) }
          )
        })
      });
    } catch (error) {
      console.log(error)
      return null;
    }

  }

  const renderTask = ({ item }) => {

    return (
      <Animatable.View
        style={styles.borda}
        animation="bounceIn"
        useNativeDriver
      >

        {(item.situacao == 0 ?
          <View style={styles.tudo}>
            <Checkbox
              style={styles.checkbox}
              value={(item.situacao == 1 ? true : false)}
              onValueChange={() => handleUpadteSituacao(item.id, item.situacao)}
              color={task.checked ? 'green' : undefined}
            />
            <View>
              <Text style={styles.task}>{item.descricao}</Text>
            </View>
            <View style={styles.status}>
              <Text >{item.status}</Text>
            </View>
          </View>
          : (
            <View style={styles.all}>
              <View>
                <Checkbox
                  style={styles.checkbox}
                  value={(item.situacao == 1 ? true : false)}
                  onValueChange={() => handleUpadteSituacao(item.id, item.situacao)}
                  color={task.checked ? 'green' : undefined}
                />
              </View>
              <View>
                <Text style={styles.tasks}>{item.descricao}</Text>
              </View>
              <View style={styles.status}>
                <Text >{item.status}</Text>
              </View>
              <View style={styles.lixeira}>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <AntDesign name="delete" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )
        )}
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#171D31" barStyle="light-content" />

      <View style={styles.content}>
        <Text style={styles.title}>Minhas tarefas</Text>
      </View>

      <FlatList
        marginHorizontal={10}
        showsHorizontalScrollIndicator={false}
        data={tasks}
        renderItem={renderTask}
        key={tak => tak.id}
      />

      <Modal
        animationType='slide'
        transparent={true}
        visible={open}
        onRequestClose={() => {
          setOpen(false);
        }}
      >
        <SafeAreaView style={styles.modal}>

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons style={{ marginLeft: 5, marginRight: 5 }} name="md-arrow-back" size={30} color="#FFF" />
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
              value={task.input}
              onChangeText={(texto) => setTask({ ...task, input: texto })}
            />
            <Picker
              selectedValue={task.status}
              style={{ height: 50, width: 150, color: "white", marginStart: 5 }}
              onValueChange={(itemValue, itemIndex) =>
                setTask({ ...task, status: itemValue })
              }>
              <Picker.Item label="Normal" value="Normal" />
              <Picker.Item label="Importante" value="Importante" />
              <Picker.Item label="Urgente" value="Urgente" />

            </Picker>
            <TouchableOpacity
              style={styles.handleAdd}
              onPress={cadastrar}
            >
              <Text style={styles.handleAddText}>Cadastrar</Text>
            </TouchableOpacity>

          </Animatable.View>

        </SafeAreaView>

      </Modal>

      <Modal
        animationType='slide'
        transparent={true}
        visible={openGrafig}
        onRequestClose={() => {
          setOpenGrafig(false);
        }}
      >
        <SafeAreaView style={styles.modal}>

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setOpenGrafig(false)}>
              <Ionicons style={{ marginLeft: 5, marginRight: 5 }} name="md-arrow-back" size={30} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Gráficos</Text>
          </View>

          <PieChart
            data={data}
            width={screenWidth * 0.95}
            height={220}
            chartConfig={chartConfig}
            accessor="quant"
            backgroundColor="transparent"
            paddingLeft="15"
          />

        </SafeAreaView>

      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="ios-add" size={35} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.icon}
        onPress={() => {
          setOpenGrafig(true)
          listCharts();
        }
        }
      >
        <AntDesign name="areachart" size={35} color="#FFF" />
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171D31',
  },
  title: {
    marginTop: 10,
    paddingBottom: 10,
    fontSize: 25,
    textAlign: 'center',
    color: '#FFF'
  },
  fab: {
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
    shadowOffset: {
      width: 1,
      height: 3,
    }
  },
  icon: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#0094FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    right: 25,
    bottom: 105,
    elevation: 2,
    zIndex: 9,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 1,
      height: 3,
    }
  },
  modal: {
    flex: 1,
    backgroundColor: '#171d31',
  },
  modalHeader: {
    marginLeft: 10,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  modalTitle: {
    marginLeft: 15,
    fontSize: 23,
    color: '#FFF'
  },
  modalBody: {
    marginTop: 15,
  },
  input: {
    fontSize: 15,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 30,
    backgroundColor: 'white',
    padding: 9,
    height: 85,
    textAlignVertical: 'top',
    color: '#000',
    borderRadius: 5,
  },
  handleAdd: {
    backgroundColor: '#FFF',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    height: 40,
    borderRadius: 5,
  },
  handleAddText: {
    fontSize: 20,
  },
  task: {
    color: "#121212",
    paddingLeft: 8,
    paddingRight: 20,
    fontSize: 20,
  },
  tasks: {
    color: "#121212",
    paddingLeft: 8,
    textDecorationLine: 'line-through',
    paddingRight: 20,
    fontSize: 20,
    opacity: 0.5,
  },
  borda: {
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
    shadowOffset: {
      width: 1,
      height: 3
    }

  },
  lixeira: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  all: {
    flex: 1,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.5,
  },
  tudo: {
    flex: 1,
    height: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    color: "#121212",
    fontSize: 15,
  }
});

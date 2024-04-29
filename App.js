import { StatusBar } from 'expo-status-bar';
import { React, useEffect, useState } from 'react';
import { Button, Dimensions, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const windowHeight = Dimensions.get('window').height;
export default function App() {
  

  const HomeScreen = ({ navigation }) => {
    const EasyLives = 5;
    const NormalLives = 3;

    const onEasyClick = () => {
      navigation.navigate("Play", {lives: EasyLives, experimental: false})
    }

    const onNormalClick = () => {
      navigation.navigate("Play", {lives: NormalLives, experimental: false})
    }

    const onExperimentalClick = () => {
      navigation.navigate("Play", {lives: EasyLives, experimental: true})
    }

    return (
      <View style={styles.container}>
        <Text>Welcome to Scripture Baseball!</Text>
        <Button title="Easy" onPress={onEasyClick}></Button>
        <Button title="Normal" onPress={onNormalClick}></Button>
        <Button title="Experimental" onPress={onExperimentalClick}></Button>
        <Text>Created by Nathan Omerza</Text>
        <a href={"https://www.churchofjesuschrist.org/comeuntochrist"} target="_blank">

          <Button title="Learn More about the Book of Mormon" />
          </a>
      </View>
    );
  }

  const PlayScreen = ({navigation, route}) => {
    const MaxHints = 5;
    const startingGuesses = route.params.lives;
    const experimental = route.params.experimental;
    const [score, setScore] = useState(0)
    const [deltaScore, setDeltaScore] = useState(0)
    const [streak, setStreak] = useState(0)
    const [justScored, setJustScored] = useState(false)
    const [start, setStart] = useState(true)
    const [guesses, setGuesses] = useState(startingGuesses);
    const [hintIndex, setHintIndex] = useState(0);
    const [gptHints, setGptHints] = useState([]);
    const bofm = require("./book-of-mormon.json")
    const gptHintFile = require("./completehints.json")
    const [current, setCurrent] = useState({book: "1 Nephi", chapter: 1, verse: 1, text: "potato"});
    const [link, setLink] = useState("https://www.churchofjesuschrist.org/comeuntochrist");
    const totalChapters = 239;
    const [chpGuess, setChpGuess] = useState('')
    const [maxChpGuess, setMax] = useState(0)
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(null);
    const [feedback, setFeedback] = useState("")
    const [hintData, setHintData] = useState([])
    const [buttons, setButtons] = useState([])
    const [showHintInd, setShowHintInd] = useState(0)
    const [redemptionDelay0, setRedemptionDelay0] = useState(null)
    const [redemptionDelay1, setRedemptionDelay1] = useState(null)
    const [redemptionDelay2, setRedemptionDelay2] = useState(null)
    const [remBonus, setRemBonus] = useState(false)
    const [redemption, setRedemption] = useState([])
    const [redemption2, setRedemption2] = useState([])
    const [prepAddRedemption, setPrepAddRedemption] = useState(false)

    const makeBookNames = () => {
      var arr = [];
      for (let i = 0; i < bofm.books.length; i++) {
        arr = [...arr, {label: bofm.books[i].book, value: bofm.books[i].book}];
      }
      return arr
    }
    
    const [items, setItems] = useState(makeBookNames());

    const genRandomVerse = () => {
      var chapterInd = Math.floor(Math.random() * totalChapters);
      for (let i = 0; i < bofm.books.length; i++) {
        if (bofm.books[i].chapters.length <= chapterInd) {
          chapterInd -= bofm.books[i].chapters.length
        } else {
          var verseInd = Math.floor(Math.random() * bofm.books[i].chapters[chapterInd].verses.length)
          var book = bofm.books[i].book
          var chapter = bofm.books[i].chapters[chapterInd].chapter
          var verse = bofm.books[i].chapters[chapterInd].verses[verseInd].verse
          var text = bofm.books[i].chapters[chapterInd].verses[verseInd].text
          var ref = bofm.books[i].chapters[chapterInd].verses[verseInd].reference
          var slug = bofm.books[i].lds_slug
          let cur = {book: book, chapter: chapter, verse: verse, text:text, ref:ref, slug:slug}
          return cur
        }
      }
    }

    const oldRandomVerse = () => {
      setChpGuess('')
      setValue(null)
      
      var cur = genRandomVerse()
      setCurrent(cur)
      const empty = ""
      var prelink = empty.concat("https://www.churchofjesuschrist.org/study/scriptures/bofm/", cur.slug, "/"
      , String(cur.chapter), "?lang=eng&id=" , String(cur.verse) , "#p" , String(cur.verse))
      setLink(prelink);
      return;
    }

    const randomVerse = (newred) => {
      setChpGuess('')
      setValue(null)
      
      var cur = genRandomVerse()
      var newarr = []
      let prob = Math.min(0.3 + (0.1 * newred.length), 0.8)
      let roll = Math.random()
      if (newred.length > 0 && roll < prob) {
        let i = Math.floor(Math.random() * newred.length)
        if (!newred[i].setdelay) {
          cur = newred[i]
          for (var j = 0; j < newred.length; j++) {
            if (j != i) {
              newarr.push(newred[j])
            }
          }
          setRemBonus(true)
        } else {
          newarr = newred
        }
      } else {
        newarr = newred
      }
      setCurrent(cur)

      for (var j = 0; j < newarr.length; j++) {
        newarr[j].setdelay = Math.max(newarr[j].setdelay - 1, 0);
      }
      setRedemption(newarr)

      setGptHints(gptHintFile[cur.ref])
      const empty = ""
      var prelink = empty.concat("https://www.churchofjesuschrist.org/study/scriptures/bofm/", cur.slug, "/"
      , String(cur.chapter), "?lang=eng&id=" , String(cur.verse) , "#p" , String(cur.verse))
      setLink(prelink);
      return;
    }


    useEffect(() => {
      for(let i = 0; i < bofm.books.length; i++) {
        if (bofm.books[i].book == value) {
          setMax(bofm.books[i].chapters.length)
          return;
        } 
      }
      setMax(0);
    }, [value]);

    useEffect(() => {
      var but = []
      for (let i = 0; i < startingGuesses - 1; i++) {
          but.push(<Button key={i} title={`Hint ${i + 1}`} onPress={
            () => {setShowHintInd(i)}} disabled={(i >= hintData.length)}
            style={{opacity: (i < hintData.length ? 1.0 : 0.0)}}
            color={(showHintInd == i) ? 'gold' : 'blue'} />);
      }
      setButtons(but)
    }, [showHintInd, hintData]);

    const makeGuessExperimental = () => {
      if (start) {
        setStart(false)
        randomVerse(redemption)
        setFeedback("")
        return;
      }
      if (justScored) {
        setGuesses(startingGuesses)
        setJustScored(false)
        setFeedback("")
        setHintData([])
        setHintIndex(0)
        setShowHintInd(0)
        setScore(Math.max(score + deltaScore, 0))
        setDeltaScore(0)
        randomVerse(redemption)
        return;
      } else if (guesses == 0) {
        var newred = current
        newred.setdelay = 1
        
        setGuesses(startingGuesses)
        setHintIndex(0)
        setStreak(0)
        setFeedback("")
        setHintData([])
        setScore(Math.max(score + deltaScore, 0))
        setDeltaScore(0)
        let fullredemption = [...redemption, newred]
        randomVerse(fullredemption)
        return;
      } else {
        if (chpGuess == null || isNaN(Number(chpGuess)) || chpGuess != Math.floor(chpGuess) || chpGuess > maxChpGuess || chpGuess <= 0) {
          setFeedback("Invalid Chapter")
          return;
        } else if (chpGuess == current.chapter && current.book == value) {
          // 100 for correct on the first try, then a linear decrease from 60 to 20 after that
          let basescore = (guesses == startingGuesses) ? 100 : 20 + Math.ceil((40 / (startingGuesses - 1))) * (guesses) 
          // Streak is exponential, but roughly 10 for each in a row.
          var rScore = 0
          if (remBonus) {
            rScore = 30
            setFeedback("REDEMPTION!")
            setRemBonus(false)
          } else {
            setFeedback("Correct!")
          }
          setDeltaScore(basescore + Math.floor(streak ** 1.2 * 10) + rScore)
          
          setStreak(streak + 1)
          setJustScored(true)
        } else {
          let newguesses = guesses - 1
          setGuesses(newguesses)
          if (newguesses == 0) {
            let ds = (-10) * (streak + 1)
            setDeltaScore(ds)
            setPrepAddRedemption(true)
          } else {
            setFeedback("")
            let shortFeedback = current.book != value ? "Wrong Book" : (chpGuess > current.chapter) ? "Lower Chapter" : "Higher Chapter"
            if (hintIndex + guesses < MaxHints && Math.random() < (MaxHints - hintIndex - guesses) / (MaxHints - hintIndex)) {
              setHintIndex(hintIndex + 1)
            }
            let gptHint = gptHints[hintIndex]
            setHintIndex(hintIndex + 1)
            const newHintObj = {hint: gptHint, short: shortFeedback, guess: `${value} ${chpGuess}`};
            let newHintData = [...hintData, newHintObj]
            setHintData(newHintData)
            var but = []
            for (let i = 0; i < startingGuesses - 1; i++) {
                but.push(<Button key={i} title={`Hint ${i + 1}`} onPress={
                  () => {setShowHintInd(i);}} disabled={(i >= newHintData.length)}
                  style={{opacity: (i < newHintData.length ? 1.0 : 0.0)}}
                  color={(showHintInd == i) ? 'gold' : 'blue'} />);
            }
            setButtons(but)
            setShowHintInd(newHintData.length - 1)
          }
        }
      }
    }

    const makeGuess = () => {
      if (start) {
        setStart(false)
        oldRandomVerse()
        setFeedback("")
        return;
      }
      if (justScored) {
        setGuesses(startingGuesses)
        setJustScored(false)
        setFeedback("")
        setHintIndex(0)
        oldRandomVerse()
        return;
      } else if (guesses == 0) {
        setGuesses(startingGuesses)
        setHintIndex(0)
        setScore(0)
        setFeedback("")
        oldRandomVerse()
        return;
      } else {
        if (chpGuess == null || isNaN(Number(chpGuess)) || chpGuess != Math.floor(chpGuess) || chpGuess > maxChpGuess || chpGuess <= 0) {
          setFeedback("Invalid Chapter")
          return;
        } else if (current.book != value) {
          setGuesses(guesses - 1)
          setFeedback("Wrong Book")
        } else if (chpGuess > current.chapter) {
          setFeedback("Lower Chapter")
          setGuesses(guesses - 1)
        } else if (chpGuess < current.chapter) {
          setFeedback("Higher Chapter")
          setGuesses(guesses - 1)
        } else {
          setFeedback("Correct!")
          setScore(score + 1)
          setJustScored(true)
        }
      }
    }

    const MakeGuessFunc = experimental ? makeGuessExperimental : makeGuess

    return (
      <View style={{flex: 1}}>
      <ScrollView style={{flex: 1, maxHeight: windowHeight, padding:2, margin:2, borderWidth:5}} contentContainerStyle={styles.container2} showsVerticalScrollIndicator={true}>
      {/*<View style={styles.container}>*/}

        {(experimental && !start && deltaScore > 0) ? (<Text>+ {deltaScore}</Text>) : (deltaScore < 0 ? (<Text>{deltaScore}</Text>) : null)}
        {(start) ? (experimental ? <Text>You receive points for correct answers, based on how many guesses are remaining. Bonus points earned from getting it right on the first try, for how many correct answers in a row, and for a "Redemption" question (correcting a previous error).</Text>: <Text>You receive one point for every correct answer. Your score is reset after an incorrect answer.</Text>) : null}
        <Text>{"Score: " + String(score)}</Text>
        {(start) ? <Text>{"This keeps track of how many guesses you have remaining."}</Text> : null}
        <Text>{"Guesses: " + String(guesses)}</Text>
        {(start) ? <Text>When this button says "Guess!" it will finalize your answer. Press "Start!" to begin!</Text> : null}
        <Button title={(start) ? "Start!" : (guesses < 1 || justScored) ? "New Verse!" : "Guess!"} onPress={MakeGuessFunc} />

        {(!start) ? <Text>{current.verse} {current.text}</Text> : <Text>A verse from "The Book of Mormon: Another Testament of Jesus Christ" will be displayed. Try to guess which Book and Chapter this verse is found!</Text>}

        
        <View style={{ flexDirection:"row", zIndex: 1}}>
          <View style={styles.dropdown}>
            <DropDownPicker placeholder="Select a Book" open={open} value={value} items={items} setOpen={setOpen} setValue={setValue} setItems={setItems}/>
            <TextInput value={chpGuess} style={styles.textback} placeholder="Select a chapter" onChangeText={(text) => setChpGuess(text)}/>
          </View>
        </View>
        <Text>{"Max Chapter: " + String(maxChpGuess)}</Text>

        {start ? (experimental ? <Text>Each incorrect guess enables a button with a hint. Hints consist of a 'Short Hint', which will be 'Wrong Book', 'Lower Chapter' or 'Higher Chapter'. The 'AI HINT' is powered by ChatGPT 3.5, to provide additional context. Note that AI can make mistakes and may be wrong or (more likely) provide useless information</Text>: <Text>Hints will be displayed here after each incorrect guess. Hints will be 'Wrong Book' if it is in the wrong book of scripture, 'Lower Chapter' if it is the correct book but the chapter is numerically lower, and 'Higher Chapter' if the chapter is higher.</Text>) : null}
        {(experimental) ? (
          <View>
            {(hintData.length > 0) ? (
            <View>
            <Text style={{ textAlign: 'center' }}>{hintData[showHintInd].guess}: {hintData[showHintInd].short}</Text>
            <Text style={{ textAlign: 'center' }}>AI Hint:  {hintData[showHintInd].hint}</Text>
            </View>) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {buttons}
          </View>
          </View>
        ) : null}
        <Text>{feedback}</Text>

        {(!start && (justScored || guesses < 1)) ?
          (<View>
          <Text>Correct Answer: {current.book} {current.chapter}</Text>
          <a href={link} target="_blank">

          <Button title="In Context" />
          </a>
          </View>) : null}

        <StatusBar style="auto" />
      {/*</View>*/}
      </ScrollView>
      </View>
    );
  }


  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name= "Home" component={HomeScreen}/>
        <Stack.Screen name= "Play" component={PlayScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: windowHeight,
  },
  container2: {
    flex: 1,
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    //maxHeight: windowHeight,
    marginTop: 10,
    marginHorizontal: 4,
    //paddingBottom: 50,
    //paddingTop: 50
  },
  dropdown: {
    color: "black"
  },
  textback: {
    backgroundColor: '#29f'
  }
});

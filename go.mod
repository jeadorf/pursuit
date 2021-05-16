module github.com/jeadorf/pursuit

go 1.13

require (
	cloud.google.com/go/firestore v1.5.0
	cloud.google.com/go/storage v1.15.0 // indirect
	firebase.google.com/go v3.13.0+incompatible
	golang.org/x/oauth2 v0.0.0-20210514164344-f6687ab2804c // indirect
	google.golang.org/api v0.46.0 // indirect
)

replace github.com/jeadorf/pursuit/document => ./document

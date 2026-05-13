class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load player images from the 1-bit platformer tile set
        this.load.image("tile_0300", "1-bit_Platformer/Tiles/Default/tile_0300.png");
        this.load.image("tile_0301", "1-bit_Platformer/Tiles/Default/tile_0301.png");
        this.load.image("tile_0302", "1-bit_Platformer/Tiles/Default/tile_0302.png");
        this.load.image("tile_0303", "1-bit_Platformer/Tiles/Default/tile_0303.png");
        this.load.image("tile_0304", "1-bit_Platformer/Tiles/Default/tile_0304.png");

        // Load tilemap information
        this.load.image("tilemap_tiles", "1-bit_Platformer/Tilemap/monochrome_tilemap_packed.png");
        this.load.tilemapTiledJSON("platformer-level-1", "mapFile.tmj");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: [
                { key: 'tile_0301' },
                { key: 'tile_0302' },
                { key: 'tile_0303' }
            ],
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: [
                { key: 'tile_0300' }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: [
                { key: 'tile_0304' }
            ],
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}
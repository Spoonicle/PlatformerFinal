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
        this.load.image("tile_0340", "1-bit_Platformer/Tiles/Default/tile_0340.png");
        this.load.image("tile_0343", "1-bit_Platformer/Tiles/Default/tile_0343.png");
        this.load.image("tile_0344", "1-bit_Platformer/Tiles/Default/tile_0344.png");
        this.load.image("tile_0058", "1-bit_Platformer/Tiles/Transparent/tile_0058.png");
        this.load.image("tile_0096", "1-bit_Platformer/Tiles/Transparent/tile_0096.png");
        this.load.image("tile_0082", "1-bit_Platformer/Tiles/Transparent/tile_0082.png");

        // Load tilemap information
        this.load.image("tilemap_tiles", "1-bit_Platformer/Tilemap/monochrome_tilemap_packed.png");
        this.load.tilemapTiledJSON("platformer-level-1", "mapFile.tmj");

        // Load smoke spritesheet (update frameWidth and frameHeight to match your actual frame sizes)
        this.load.spritesheet("smoke", "smoke.png", { frameWidth: 384, frameHeight: 384 });
        this.load.spritesheet("fumacinha", "Fumacinha.png", { frameWidth: 384, frameHeight: 384 });

        // Load jump sound
        this.load.audio("pepSound1", "pepSound1.ogg");
        this.load.audio("pepSound2", "pepSound2.ogg");
        this.load.audio("pepSound3", "pepSound3.ogg");
        this.load.audio("pepSound4", "pepSound4.ogg");
        this.load.audio("pepSound5", "pepSound5.ogg");

        this.load.audio("player_fall", "player_fall.ogg");

        this.load.audio("gem_sound", "powerUp5.ogg");
        this.load.audio("winSound", "powerUp1.ogg");

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
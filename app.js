
const s = (sketch) => {

    const imageFormat = "image/png";

    const HEAD_STAGE = 0
    const TORSO_STAGE = 1
    const LEGS_STAGE = 2
    const stageSections = [HEAD_STAGE, TORSO_STAGE, LEGS_STAGE]
    const END_STAGE = 3

    var stage = HEAD_STAGE

    const surfaceScalar = 0.05

    var bufferWidth
    var bufferHeight
    var bufferHeightMid
    var sectionWidth
    var sectionHeight
    var sectionHeightMid
    var drawBuffer
    var buffers = []

    //forward delcaration
    var loadData

    function compress(s) {
        return LZString.compressToEncodedURIComponent(s);
    }

    function decompress(s) {
        return LZString.decompressFromEncodedURIComponent(s);
    }

    sketch.setup = () => {
        sketch.createCanvas(800, 1200);
        sketch.background(0);

        loadData(sketch)
        if (stage === END_STAGE) {
            sketch.noLoop()
        }
    };

    sketch.draw = () => {
        sketch.background(255)

        sketch.noSmooth()
        var i = 0
        _.each(buffers, function (buffer) {
            sketch.image(buffer, 0, sectionHeight * i, sectionWidth, sectionHeightMid)
            ++i
        })
        sketch.smooth()

        if (stage !== END_STAGE) {
            _.each(stageSections, function (i) {
                if (stage>i){
                    sketch.fillStyle = "#999"
                    sketch.rect(0, sectionHeight*i, sketch.width, sectionHeight)
                }

                sketch.stroke(0, 0, 255)
                sketch.line(0, sectionHeight * i, sketch.width, sectionHeight * i)
            })
        }
    };

    sketch.keyPressed = (e) => {
        if (e.key == 'r') {
            //reset?
        }
    }
    function generateShareURL(){
        function serialize(buf) {
            var data = buf.canvas.toDataURL(imageFormat);
            data = compress(data);
            return data
        }

        let serializedBuffers = _.map(buffers, serialize)
        let tags = {}
        if (stage === HEAD_STAGE) {
            tags["headData"] = serializedBuffers[HEAD_STAGE]
        } else if (stage === TORSO_STAGE) {
            tags["headData"] = serializedBuffers[HEAD_STAGE]
            tags["torsoData"] = serializedBuffers[TORSO_STAGE]
        } else if (stage === LEGS_STAGE) {
            tags["headData"] = serializedBuffers[HEAD_STAGE]
            tags["torsoData"] = serializedBuffers[TORSO_STAGE]
            tags["legsData"] = serializedBuffers[LEGS_STAGE]
        }

        const myUrlWithParams = new URL(window.location.protocol + "//" + window.location.host + window.location.pathname);
        _.each(tags, function (v, k) {
            myUrlWithParams.searchParams.append(k, v);
        })
        return myUrlWithParams.href;
    }

    sketch.keyReleased = (e) => {
        if (e.key === "p") {
            document.getElementById("shareUrl").textContent = generateShareURL();
        }
    }

    sketch.mouseDragged = (e) => {
        if (stage !== END_STAGE) {
            //do drawing
            // sketch.fill(255,0,0)

            // allow draw in a segment

            drawBuffer.noStroke()
            drawBuffer.fill(255, 0, 0)
            //todo offset by active section
            let x = sketch.map(e.pageX, 0, sketch.width, 0, bufferWidth)
            let y = sketch.map(e.pageY, stage * sectionHeight, stage * sectionHeight + sectionHeightMid, 0, bufferHeightMid)
            drawBuffer.circle(x, y, 1)
            // drawBuffer.rect
            // drawBuffer.circle(e.pageX ,e.pageY, 5)
            return false
        }
    }

    loadData = function (sketch) {
        // setup buffer and draw area sizes
        let midEdgeScalar = 0.07
        sectionWidth = sketch.width
        sectionHeight = Math.floor(sketch.height / 3)
        sectionHeightMid = sectionHeight + sectionHeight * midEdgeScalar

        bufferWidth = Math.floor(sketch.width * surfaceScalar)
        bufferHeight = Math.floor(sketch.height / 3 * surfaceScalar)
        let bufferHeightEdge = Math.floor(bufferHeight * midEdgeScalar)
        bufferHeightMid = bufferHeight + bufferHeightEdge

        // get the state from the url
        const params = new URLSearchParams(document.location.search.substring(1));
        const headData = params.get("headData");
        const torsoData = params.get("torsoData");
        const legsData = params.get("legsData");
        if (headData === "" || headData == null) {
            //new corpse
            stage = HEAD_STAGE

            drawBuffer = sketch.createGraphics(bufferWidth, bufferHeightMid)
            drawBuffer.background(255)

            buffers.push(drawBuffer)
            _.each(buffers, function (b) {b.clear()})

            // setup mouse draw events for first quadrant


        } else if (torsoData === "" || torsoData == null) {
            // player 2
            stage = TORSO_STAGE


            drawBuffer = sketch.createGraphics(bufferWidth, bufferHeightMid)
            // drawBuffer.background(255)
            // drawBuffer.clear()

            buffers.push(sketch.createGraphics(bufferWidth, bufferHeightMid))
            buffers.push(drawBuffer)
            _.each(buffers, function (b) {b.clear()})

            let img = document.getElementById("imageDataLoader0")
            img.src = decompress(headData)

            buffers[HEAD_STAGE].canvas.getContext("2d").drawImage(img, 0, 0, buffers[0].width, buffers[0].height)
        } else if (legsData === "" || legsData == null) {
            // player 3
            stage = LEGS_STAGE

            drawBuffer = sketch.createGraphics(bufferWidth, bufferHeight)
            // drawBuffer.background(255)


            buffers.push(sketch.createGraphics(bufferWidth, bufferHeightMid))
            buffers.push(sketch.createGraphics(bufferWidth, bufferHeightMid))
            buffers.push(drawBuffer)
            _.each(buffers, function (b) {b.clear()})

            let img = document.getElementById("imageDataLoader0")
            img.src = decompress(headData)
            buffers[HEAD_STAGE].canvas.getContext("2d").drawImage(img, 0, 0, bufferWidth, bufferHeightMid)
            img = document.getElementById("imageDataLoader1")
            img.src = decompress(torsoData)
            buffers[TORSO_STAGE].canvas.getContext("2d").drawImage(img, 0, 0, bufferWidth, bufferHeightMid)
        } else {
            // complete corpse!
            // draw each image here and disable mouse events
            stage = END_STAGE
            buffers.push(sketch.createGraphics(bufferWidth, bufferHeightMid))
            buffers.push(sketch.createGraphics(bufferWidth, bufferHeightMid))
            buffers.push(sketch.createGraphics(bufferWidth, bufferHeight))
            _.each(buffers, function (b) {b.clear()})

            let img = document.getElementById("imageDataLoader0")
            img.src = decompress(headData)
            buffers[HEAD_STAGE].canvas.getContext("2d").drawImage(img, 0, 0, bufferWidth, bufferHeightMid)
            img = document.getElementById("imageDataLoader1")
            img.src = decompress(torsoData)
            buffers[TORSO_STAGE].canvas.getContext("2d").drawImage(img, 0, 0, bufferWidth, bufferHeightMid)
            img = document.getElementById("imageDataLoader2")
            img.src = decompress(legsData)
            buffers[LEGS_STAGE].canvas.getContext("2d").drawImage(img, 0, 0, bufferWidth, bufferHeight)
        }
    }
};

let myp5 = new p5(s, "sketchContainer");